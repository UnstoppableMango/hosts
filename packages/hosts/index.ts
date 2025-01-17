import { remote } from '@pulumi/command';
import * as pulumi from '@pulumi/pulumi';
import * as random from '@pulumi/random';
import { Command } from '@unmango/baremetal';
import { Cat, Mkdir, Tee, Wget } from '@unmango/baremetal/coreutils';
import { Certs, CniPlugins, Crictl, Directory, Etcd, Kubeadm, Kubectl, Kubelet, KubeVip, Runner } from 'components';
import * as config from './config';

const name = config.hostname;

const runner = new Runner({
	host: config.ip,
	privateKey: config.loginKey,
});

const installScriptUrl = pulumi
	.interpolate`https://github.com/unmango/pulumi-baremetal/releases/download/v${config.versions.baremetal}/install.sh`;

const provisioner = runner.run(remote.Command, 'provisioner', {
	environment: {
		PULUMI_COMMAND_IREADTHEDOCS: 'true',
		PULUMI_COMMAND_LISTEN_ADDRESS: config.provisionerAddress,
	},
	create: pulumi.interpolate`curl -L ${installScriptUrl} | bash`,
});

export const provisionerInstallLogs = provisioner.stdout;

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

// const cniPlugins = new CniPlugins(name, {
// 	arch: config.arch,
// 	version: config.versions.cniPlugins,
// }, { dependsOn: provisioner });

// const kubelet = new Kubelet(name, {
// 	arch: config.arch,
// 	version: config.versions.k8s,
// 	kubernetesDirectory: k8sDir.path,
// 	systemdDirectory: config.systemdDirectory,
// 	bootstrapKubeconfig: '/etc/kubernetes/bootstrap-kubelet.conf', // Hoping to remove this if possible
// 	kubeconfig: '/etc/kubernetes/kubelet.conf', // kubeadm generate-csr will create this
// 	containerdSocket: 'unix:///run/containerd/containerd.sock',
// }, { dependsOn: [provisioner, k8sDir] });

let etcd: Etcd | null = null;

if (config.role === 'controlplane') {
	if (!config.vipInterface) {
		throw new Error('ControlPlane requires a vipInterface');
	}

	// const certs = new Certs(name, {
	// 	etcdCa: config.etcdCa,
	// 	theclusterCa: config.theclusterCa,
	// 	k8sDir: k8sDir.path,
	// 	kubeadmcfgPath: kubeadm.configurationPath,
	// 	pkiPath: pkiDir.path,
	// }, { dependsOn: kubeadm });

	// const preflight = new Command('init-phase-preflight', {
	// 	create: ['kubeadm', 'init', 'phase', 'preflight', '--config', kubeadm.configurationPath],
	// }, { dependsOn: [kubeadm, certs] });

	// etcd = new Etcd(name, {
	// 	arch: config.arch,
	// 	version: config.versions.etcd,
	// 	caCertPem: config.etcdCa.certPem,
	// 	caKeyPem: config.etcdCa.privateKeyPem,
	// 	// manifestDir: kubelet.manifestDir,
	// 	manifestDir: '',
	// 	certsDirectory: pkiDir.path,
	// 	kubeadmcfgPath: kubeadm.configurationPath,
	// }, {
	// 	dependsOn: [
	// 		// kubelet,
	// 		kubeadm,
	// 	],
	// });

	// const kubeVip = new KubeVip(name, {
	// 	clusterEndpoint: config.clusterEndpoint,
	// 	interface: config.vipInterface,
	// 	kubeconfigPath: certs.adminConfPath,
	// 	version: config.versions.kubeVip,
	// 	manifestDir: kubelet.manifestDir,
	// }, { dependsOn: [k8sDir, etcd] });

	// const controlPlane = new Command('init-phase-control-plane', {
	// 	create: ['kubeadm', 'init', 'phase', 'control-plane'],
	// }, { dependsOn: [kubeadm, preflight] });
	// kubeadmPhases.push(controlPlane);

	// const kubeletStart = new Command('init-phase-kubelet-start', {
	// 	create: ['kubeadm', 'init', 'phase', 'kubelet-start', '--config', kubeadm.configurationPath],
	// }, { dependsOn: [kubeadm, kubeVip, etcd, controlPlane] });
	// kubeadmPhases.push(kubeletStart);

	// const uploadConfig = new Command('init-phase-upload-config', {
	// 	create: ['kubeadm', 'init', 'phase', 'upload-config'],
	// }, { dependsOn: [kubeadm, kubeletStart] });
	// kubeadmPhases.push(uploadConfig);

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

const acceptK3sEnv = new Tee('k3s-acceptEnv', {
	args: {
		files: ['/etc/ssh/sshd_config.d/10-install-k3s.conf'],
		stdin: pulumi.interpolate`# Managed by pulumi
AcceptEnv INSTALL_K3S_*
AcceptEnv K3S_*
`,
	},
}, { dependsOn: provisioner });

const k3sManifests = new Mkdir('manifests', {
	args: {
		directory: ['/var/lib/rancher/k3s/server/manifests'],
		parents: true,
	},
}, { dependsOn: provisioner });

const kubeVip: pulumi.Resource[] = [];

if (config.bootstrapNode === name) {
	const kubeVipRbac = new Wget('kube-vip-rbac', {
		args: {
			urls: ['https://kube-vip.io/manifests/rbac.yaml'],
			outputDocument: pulumi.interpolate`${k3sManifests.args.directory[0]}/kube-vip-rbac.yaml`,
		},
	}, { dependsOn: provisioner });

	const kubeVipDaemonset = new Tee('kube-vip-daemonset', {
		args: {
			files: [pulumi.interpolate`${k3sManifests.args.directory[0]}/kube-vip.yaml`],
			stdin: KubeVip.daemonSet(),
		},
	}, { dependsOn: [provisioner, k3sManifests] });

	kubeVip.push(kubeVipRbac, kubeVipDaemonset);
}

const adminKubeconfigPath = '/etc/kubernetes/k3s-admin.kubeconfig';

// https://docs.k3s.io/reference/env-variables
const k3sInstallEnv: Record<string, pulumi.Input<string>> = {
	INSTALL_K3S_SYMLINK: 'skip',
	INSTALL_K3S_VERSION: config.versions.k3s,
	INSTALL_K3S_BIN_DIR: '/usr/local/bin',
	INSTALL_K3S_SYSTEMD_DIR: config.systemdDirectory,
	// K3S_CLUSTER_INIT: 'true',
	K3S_KUBECONFIG_OUTPUT: adminKubeconfigPath,
	K3S_TOKEN: config.k3sToken,
	K3S_URL: `https://${config.clusterEndpoint}:6443`,
};

if (etcd) {
	// k3sInstallEnv.K3S_DATASTORE_ENDPOINT = 'etcd';
	// k3sInstallEnv.K3S_DATASTORE_CAFILE = etcd.caPath;
}

const k3sArgs: pulumi.Input<string>[] = [
	config.role === 'controlplane' ? 'server' : 'agent',
];

if (config.role === 'controlplane') {
	k3sArgs.push(
		`--tls-san=${config.bootstrapIp}`,
		`--tls-san=${config.clusterEndpoint}`,
		`--disable-network-policy`,
		`--disable-helm-controller`,
		`--disable-cloud-controller`,
		`--disable=traefik`,
		`--disable=metrics-server`,
		`--disable=servicelb`,
	);
} else {
	// k3sArgs.push('agent');
}

const k3sArgsString = pulumi.all(k3sArgs).apply((x) => x.join(' '));
const k3sInstall = runner.run(remote.Command, 'k3s-install', {
	environment: k3sInstallEnv,
	create: pulumi.interpolate`curl -sfL https://get.k3s.io | sh -s - ${k3sArgsString}`,
	// https://docs.k3s.io/installation/uninstall
	delete: config.role === 'controlplane' ? '/usr/local/bin/k3s-uninstall.sh' : '/usr/local/bin/k3s-agent-uninstall.sh',
}, { dependsOn: [provisioner, k3sManifests, acceptK3sEnv, kubectl, crictl, ...kubeVip] });

export const k3sInstallLogs = k3sInstall.stdout;

let adminConfig: Cat | null = null;
if (config.role === 'controlplane') {
	adminConfig = new Cat('admin-config', {
		args: {
			files: [adminKubeconfigPath],
		},
	}, { dependsOn: k3sInstall, additionalSecretOutputs: ['stdout'] });
}

export const kubeconfig = adminConfig?.stdout;
