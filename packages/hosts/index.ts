import { remote } from '@pulumi/command';
import * as pulumi from '@pulumi/pulumi';
import { CniPlugins, Containerd, Crictl, Ipv4PacketForwarding, Kubeadm, Kubectl, Kubelet, Netplan, Runc, Runner } from 'components';
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

const kubectl = runner.run(Kubectl, name, {
	arch: config.arch,
	version: config.versions.k8s,
});

const kubeadm = runner.run(Kubeadm, name, {
	arch: config.arch,
	version: config.versions.k8s,
});

if (config.role === 'worker') {
	runner.run(Ipv4PacketForwarding, name, {});

	runner.run(CniPlugins, name, {
		arch: config.arch,
		version: config.versions.cniPlugins,
	});

	runner.run(Containerd, name, {
		arch: config.arch,
		version: config.versions.containerd,
	});

	runner.run(Crictl, name, {
		arch: config.arch,
		version: config.versions.crictl,
	});

	runner.run(Kubelet, name, {
		arch: config.arch,
		version: config.versions.k8s,
	});

	runner.run(Runc, name, {
		arch: config.arch,
		version: config.versions.runc,
	});
}

// // TODO: Not all of these are needed on both localhost and clusterIp
// // https://kubernetes.io/docs/reference/networking/ports-and-protocols/#control-plane
// ['127.0.0.1', this.config.clusterIp].map(ip => {
// 	this.allowPort(ip, 6443); // Kubernetes API server
// 	this.allowPort(ip, 2379); // etcd server client API
// 	this.allowPort(ip, 2380); // etcd server client API
// 	this.allowPort(ip, 10250); // Kubelet API
// 	this.allowPort(ip, 10259); // kube-scheduler
// 	this.allowPort(ip, 10257); // kube-controller-manager
// });

// // https://kubernetes.io/docs/reference/networking/ports-and-protocols/#node
// ['127.0.0.1', this.config.clusterIp].map(ip => {
// 	this.allowPort(ip, 10250); // Kubelet API
// 	this.allowPort(ip, 10256); // kube-proxy
// });
