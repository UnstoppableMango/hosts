import { remote } from '@pulumi/command';
import * as pulumi from '@pulumi/pulumi';
import { Command } from '@unmango/baremetal';
import {
	ApiServer,
	Certs,
	CniPlugins,
	Crictl,
	Directory,
	Etcd,
	Kubeadm,
	Kubectl,
	Kubelet,
	KubeVip,
	Runner,
} from 'components';
import * as config from './config';

const name = config.hostname;

const runner = new Runner({
	host: config.ip,
	privateKey: config.loginKey,
});

const provisioner = runner.run(remote.Command, 'provisioner', {
	environment: {
		PULUMI_COMMAND_IREADTHEDOCS: 'true',
		PULUMI_COMMAND_LISTEN_ADDRESS: config.provisionerAddress,
	},
	create: pulumi
		.interpolate`curl -L https://github.com/unmango/pulumi-baremetal/releases/download/v${config.versions.baremetal}/install.sh | bash`,
});

export const provisionerInstallLogs = provisioner.stdout;

// let networks: Network = {
// 	ethernets: config.ethernets,
// 	bonds: config.bonds,
// 	vlans: config.vlans,
// };

// let bondingMod: remote.CopyToRemote | undefined;
// let modprobe: remote.Command | undefined;

// if (networks.bonds) {
// 	bondingMod = runner.run(remote.CopyToRemote, 'systemd-bonding', {
// 		remotePath: '/etc/modules-load.d/bonding.conf',
// 		source: new pulumi.asset.StringAsset('bonding'),
// 	});

// 	modprobe = runner.run(remote.Command, 'bonding-modprobe', {
// 		create: 'modprobe bonding',
// 		delete: 'modprobe -r bonding',
// 	}, { dependsOn: bondingMod });
// }

// const netplan = runner.run(Netplan, name, {
// 	config: networks,
// 	name: 'thecluster',
// 	priority: 69,
// }, { dependsOn: modprobe });

// const ipv4Forwarding = runner.run(Ipv4PacketForwarding, name, {});

const k8sDir = new Directory('kubernetes-config', {
	path: config.kubernetesDirectory,
}, { dependsOn: [provisioner] });

const pkiDir = new Directory('pki', {
	path: pulumi.interpolate`${k8sDir.path}/pki`,
}, { dependsOn: [provisioner, k8sDir] });

const kubectl = new Kubectl(name, {
	arch: config.arch,
	version: config.versions.k8s,
}, { dependsOn: [provisioner] });

const kubeadm = new Kubeadm(name, {
	arch: config.arch,
	version: config.versions.k8s,
	clusterEndpoint: config.clusterEndpoint,
	hostname: name,
	hosts: config.hosts,
	kubernetesDirectory: k8sDir.path,
	certificatesDirectory: pkiDir.path,
}, { dependsOn: [provisioner, pkiDir] });

const crictl = new Crictl(name, {
	arch: config.arch,
	version: config.versions.crictl,
}, { dependsOn: [provisioner] });

const cniPlugins = new CniPlugins(name, {
	arch: config.arch,
	version: config.versions.cniPlugins,
}, { dependsOn: provisioner });

const kubelet = new Kubelet(name, {
	arch: config.arch,
	version: config.versions.k8s,
	kubernetesDirectory: k8sDir.path,
	systemdDirectory: config.systemdDirectory,
	bootstrapKubeconfig: '/etc/kubernetes/bootstrap-kubelet.conf', // Hoping to remove this if possible
	kubeconfig: '/etc/kubernetes/kubelet.conf', // kubeadm generate-csr will create this
	containerdSocket: 'unix:///run/containerd/containerd.sock',
}, { dependsOn: [provisioner, k8sDir] });

if (config.role === 'controlplane') {
	if (!config.vipInterface) {
		throw new Error('ControlPlane requires a vipInterface');
	}

	const certs = new Certs(name, {
		etcdCa: config.etcdCa,
		theclusterCa: config.theclusterCa,
		k8sDir: k8sDir.path,
		kubeadmcfgPath: kubeadm.configurationPath,
		pkiPath: pkiDir.path,
	}, { dependsOn: kubeadm });

	const preflight = new Command('init-phase-preflight', {
		create: ['kubeadm', 'init', 'phase', 'preflight', '--config', kubeadm.configurationPath],
	}, { dependsOn: [kubeadm, certs] });

	const kubeVip = new KubeVip(name, {
		clusterEndpoint: config.clusterEndpoint,
		interface: config.vipInterface,
		kubeconfigPath: certs.adminConfPath,
		version: config.versions.kubeVip,
		manifestDir: kubelet.manifestDir,
	}, { dependsOn: [k8sDir] });

	// const apiserver = new ApiServer(name, {
	// 	arch: config.arch,
	// 	kubeadmcfgPath: kubeadm.configurationPath,
	// 	caCertPem: config.etcdCa.certPem,
	// 	caKeyPem: config.etcdCa.privateKeyPem,
	// 	pkiPath: pkiDir.path,
	// }, { dependsOn: kubeadm });

	// const etcd = new Etcd(name, {
	// 	arch: config.arch,
	// 	version: config.versions.etcd,
	// 	caCertPem: config.etcdCa.certPem,
	// 	caKeyPem: config.etcdCa.privateKeyPem,
	// 	manifestDir: kubelet.manifestDir,
	// 	certsDirectory: pkiDir.path,
	// 	kubeadmcfgPath: kubeadm.configurationPath,
	// }, { dependsOn: [certs, kubelet, kubeadm] });

	// 	const init = runner.run(remote.Command, 'kubeadm-init', {
	// 		create: pulumi.all([
	// 			pulumi.interpolate`kubeadm init`,
	// 			pulumi.interpolate`--config ${kubeadm.configurationPath}`,
	// 			pulumi.interpolate`--ignore-preflight-errors ${
	// 				[
	// 					'Port-2379',
	// 					'Port-2380',
	// 					'Port-10250',
	// 					'Port-10259',
	// 					'Port-10260',
	// 				].join(',')
	// 			}`,
	// 		]).apply(x => x.join(' ')),
	// 	}, {
	// 		dependsOn: [
	// 			ipv4Forwarding,
	// 			kubeadm,
	// 			imagePull,
	// 			etcd,
	// 			kubeVip,
	// 			kubelet,
	// 			kubectl,
	// 		],
	// 	});
}

// if (config.role === 'worker') {
// 	runner.run(CniPlugins, name, {
// 		arch: config.arch,
// 		version: config.versions.cniPlugins,
// 	});
// }
