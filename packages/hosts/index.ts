import { remote } from '@pulumi/command';
import * as pulumi from '@pulumi/pulumi';
import { Kubeadm, Kubectl, Netplan, Runner } from 'components';
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

	modprobe = runner.run(remote.Command, 'modprobe', {
		create: 'modprobe bonding',
		delete: 'modprobe -r bonding',
	}, { dependsOn: bondingMod });
}

const netplan = runner.run(Netplan, 'vlan', {
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
