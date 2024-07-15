import { remote } from '@pulumi/command';
import * as pulumi from '@pulumi/pulumi';
import {
	CniPlugins,
	Containerd,
	Crictl,
	Etcd,
	Ipv4PacketForwarding,
	Kubeadm,
	Kubectl,
	Kubelet,
	KubeVip,
	Netplan,
	Runc,
	Runner,
} from 'components';
import { Network } from 'components/src/netplan';
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

const k8sDir = config.kubernetesDirectory;
const k8sConfigMkdir = runner.run(remote.Command, 'kubernetes-config', {
	create: pulumi.interpolate`mkdir -p ${k8sDir}`,
	delete: pulumi.interpolate`rm -rf ${k8sDir}`,
	triggers: [k8sDir],
}, { deleteBeforeReplace: true });

const kubectl = runner.run(Kubectl, name, {
	arch: config.arch,
	version: config.versions.k8s,
});

const kubeadm = runner.run(Kubeadm, name, {
	arch: config.arch,
	version: config.versions.k8s,
	hostname: name,
	hosts: config.controlplanes,
	kubernetesDirectory: k8sDir,
}, { dependsOn: netplan });

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

const kubelet = runner.run(Kubelet, name, {
	arch: config.arch,
	version: config.versions.k8s,
	kubernetesDirectory: k8sDir,
	systemdDirectory: config.systemdDirectory,
	bootstrapKubeconfig: '/etc/kubernetes/bootstrap-kubelet.conf',
	kubeconfig: '/etc/kubernetes/kubelet.conf',
	containerdSocket: containerd.socketPath,
}, { dependsOn: [containerd, k8sConfigMkdir] });

if (config.role === 'controlplane') {
	if (!config.vipInterface) {
		throw new Error('ControlPlane requires a vipInterface');
	}

	const kubeVip = runner.run(KubeVip, name, {
		clusterEndpoint: config.clusterEndpoint,
		interface: config.vipInterface,
		kubeconfigPath: pulumi.interpolate`${k8sDir}/admin.conf`, // Create this
		version: config.versions.kubeVip,
		manifestDir: kubelet.manifestDir,
	}, { dependsOn: [k8sConfigMkdir, kubelet] });

	const etcd = runner.run(Etcd, name, {
		arch: config.arch,
		version: config.versions.etcd,
		caCertPem: config.etcdCa.certPem,
		caKeyPem: config.etcdCa.privateKeyPem,
		kubeadmcfgPath: kubeadm.configurationPath,
	}, { dependsOn: [containerd, kubelet, kubeadm] });

	const init = runner.run(remote.Command, 'kubeadm-init', {
		create: pulumi.interpolate`kubeadm init --control-plane-endpoint ${config.clusterEndpoint}`,
	});
}

if (config.role === 'worker') {
	runner.run(Ipv4PacketForwarding, name, {});

	runner.run(CniPlugins, name, {
		arch: config.arch,
		version: config.versions.cniPlugins,
	});
}

// const init = runner.run(remote.Command, 'kubeadm-init', {
// 	create: pulumi.interpolate`${kubeadm.path} init --control-plane-endpoint ${config.clusterEndpoint}`,
// }, {
// 	dependsOn: [
// 		containerd,
// 		kubelet,
// 		kubeadm,
// 	],
// });
