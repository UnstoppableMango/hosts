import { remote } from '@pulumi/command';
import * as pulumi from '@pulumi/pulumi';
import {
	CniPlugins,
	Containerd,
	Crictl,
	Directory,
	Etcd,
	Ipv4PacketForwarding,
	Kubeadm,
	Kubectl,
	Kubelet,
	KubeVip,
	Netplan,
	Network,
	Runc,
	Runner,
} from 'components';
import * as config from './config';

const name = config.hostname;

const runner = new Runner({
	host: config.ip,
	privateKey: config.loginKey,
});

let networks: Network = {
	ethernets: config.ethernets,
	bonds: config.bonds,
	vlans: config.vlans,
};

let bondingMod: remote.CopyToRemote | undefined;
let modprobe: remote.Command | undefined;

if (networks.bonds) {
	bondingMod = runner.run(remote.CopyToRemote, 'systemd-bonding', {
		remotePath: '/etc/modules-load.d/bonding.conf',
		source: new pulumi.asset.StringAsset('bonding'),
	});

	modprobe = runner.run(remote.Command, 'bonding-modprobe', {
		create: 'modprobe bonding',
		delete: 'modprobe -r bonding',
	}, { dependsOn: bondingMod });
}

const netplan = runner.run(Netplan, name, {
	config: networks,
	name: 'thecluster',
	priority: 69,
}, { dependsOn: modprobe });

const ipv4Forwarding = runner.run(Ipv4PacketForwarding, name, {});

const k8sDir = runner.run(Directory, 'kubernetes-config', {
	path: config.kubernetesDirectory,
});

const pkiDir = runner.run(Directory, 'pki', {
	path: pulumi.interpolate`${k8sDir.path}/pki`,
}, { dependsOn: k8sDir });

const kubectl = runner.run(Kubectl, name, {
	arch: config.arch,
	version: config.versions.k8s,
});

const kubeadm = runner.run(Kubeadm, name, {
	arch: config.arch,
	version: config.versions.k8s,
	clusterEndpoint: config.clusterEndpoint,
	hostname: name,
	hosts: config.hosts,
	kubernetesDirectory: k8sDir.path,
	certificatesDirectory: pkiDir.path,
	caCertPem: config.theclusterCa.certPem,
	caKeyPem: config.theclusterCa.privateKeyPem,
}, { dependsOn: [netplan, pkiDir] });

const crictl = runner.run(Crictl, name, {
	arch: config.arch,
	version: config.versions.crictl,
});

const runc = runner.run(Runc, name, {
	arch: config.arch,
	version: config.versions.runc,
});

const containerd = runner.run(Containerd, name, {
	arch: config.arch,
	version: config.versions.containerd,
	systemdDirectory: config.systemdDirectory,
}, { dependsOn: runc });

const imagePull = runner.run(remote.Command, 'pull-images', {
	create: `kubeadm config images pull`,
}, { dependsOn: [containerd, kubeadm] });

const kubelet = runner.run(Kubelet, name, {
	arch: config.arch,
	version: config.versions.k8s,
	kubernetesDirectory: k8sDir.path,
	systemdDirectory: config.systemdDirectory,
	kubeconfig: '/etc/kubernetes/kubelet.conf',
	containerdSocket: containerd.socketPath,
}, { dependsOn: [containerd, k8sDir] });

if (config.role === 'controlplane') {
	if (!config.vipInterface) {
		throw new Error('ControlPlane requires a vipInterface');
	}

	const etcd = runner.run(Etcd, name, {
		arch: config.arch,
		version: config.versions.etcd,
		caCertPem: config.etcdCa.certPem,
		caKeyPem: config.etcdCa.privateKeyPem,
		manifestDir: kubelet.manifestDir,
		certsDirectory: pkiDir.path,
		kubeadmcfgPath: kubeadm.configurationPath,
	}, { dependsOn: [containerd, kubelet, kubeadm] });

	const etcdCerts = [
		etcd.initCert(kubeadm, 'server', { dependsOn: [kubeadm, etcd] }),
		etcd.initCert(kubeadm, 'peer', { dependsOn: [kubeadm, etcd] }),
		etcd.initCert(kubeadm, 'healthcheck-client', { dependsOn: [kubeadm, etcd] }),
	];

	const apiServerCerts = [
		kubeadm.initCert('apiserver', undefined, { dependsOn: kubeadm }),
		kubeadm.initCert('apiserver-kubelet-client', undefined, { dependsOn: kubeadm }),
		kubeadm.initCert('apiserver-etcd-client', undefined, { dependsOn: [kubeadm, etcd] }),
	];

	const frontProxyCa = kubeadm.initCert('front-proxy-ca', undefined, { dependsOn: kubeadm });
	const frontProxyClient = kubeadm.initCert('front-proxy-client', undefined, { dependsOn: [kubeadm, frontProxyCa] });
	const saCert = kubeadm.saCert({ dependsOn: kubeadm });

	const certsPhase = [
		...etcdCerts,
		...apiServerCerts,
		frontProxyCa,
		frontProxyClient,
		saCert,
	];

	const kubeconfigs = [
		kubeadm.initKubeconfig('admin', { dependsOn: certsPhase }),
		kubeadm.initKubeconfig('super-admin', { dependsOn: certsPhase }),
		kubeadm.initKubeconfig('kubelet', { dependsOn: certsPhase }),
		kubeadm.initKubeconfig('controller-manager', { dependsOn: certsPhase }),
		kubeadm.initKubeconfig('scheduler', { dependsOn: certsPhase }),
	];

	const kubeVip = runner.run(KubeVip, name, {
		clusterEndpoint: config.clusterEndpoint,
		interface: config.vipInterface,
		kubeconfigPath: pulumi.interpolate`${k8sDir.path}/admin.conf`,
		version: config.versions.kubeVip,
		manifestDir: kubelet.manifestDir,
	}, { dependsOn: [k8sDir, ...kubeconfigs] });

	const etcdLocal = etcd.initLocal(kubeadm, { dependsOn: kubeconfigs });

	const controlplanePhase = [
		kubeadm.initControlPlane('apiserver', { dependsOn: etcdLocal }),
		kubeadm.initControlPlane('controller-manager', { dependsOn: etcdLocal }),
		kubeadm.initControlPlane('scheduler', { dependsOn: etcdLocal }),
	];

	const startKubelet = kubeadm.phase('kubelet-start', {}, { dependsOn: [...controlplanePhase, kubeVip] });

	const uploadConfig = [
		kubeadm.phase('upload-config kubeadm', {}, { dependsOn: startKubelet }),
		kubeadm.phase('upload-config kubelet', {}, { dependsOn: startKubelet }),
	];

	const uploadCerts = kubeadm.phase('upload-certs', {}, { dependsOn: uploadConfig });
	const markControlPlane = kubeadm.phase('mark-control-plane', {}, { dependsOn: uploadCerts });
	const bootstrapToken = kubeadm.phase('bootstrap-token', {}, { dependsOn: markControlPlane });
	const kubeletFinalize = kubeadm.phase('kubelet-finalize experimental-cert-rotation', {}, { dependsOn: bootstrapToken });

	const addons = [
		kubeadm.phase('addon coredns', {}, { dependsOn: kubeletFinalize }),
		kubeadm.phase('addon kube-proxy', {}, { dependsOn: kubeletFinalize }),
	];

	const showJoinCommand = kubeadm.phase('show-join-command', {}, { dependsOn: addons });
}

if (config.role === 'worker') {
	runner.run(CniPlugins, name, {
		arch: config.arch,
		version: config.versions.cniPlugins,
	});
}
