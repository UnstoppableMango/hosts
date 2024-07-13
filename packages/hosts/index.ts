import * as pulumi from '@pulumi/pulumi';
import { remote } from '@pulumi/command';
import * as config from './config';
import { Runner, Netplan, Kubeadm, Kubectl } from 'components';

const name = config.hostname;

const runner = new Runner({
	host: config.ip,
	privateKey: config.loginKey,
});

let ethernets: Netplan | undefined;
let bond: Netplan | undefined;
let vlan: Netplan | undefined;

if (config.ethernets) {
	ethernets = runner.run(Netplan, 'ethernets', {
		config: Netplan.ethernets(config.ethernets),
		file: '/etc/netplan/20-ethernets.yaml',
	});
}

if (config.bond) {
	runner.run(remote.CopyToRemote, 'systemd-module', {
		remotePath: '/etc/modules-load.d/bonding.conf',
		source: new pulumi.asset.StringAsset('bonding'),
	});

	const modprobe = runner.run(remote.Command, 'modprobe', {
		create: 'modprobe bonding',
		delete: 'modprobe -r bonding',
	});

	bond = runner.run(Netplan, 'bond', {
		config: Netplan.bond(config.bond),
		file: '/etc/netplan/60-bonding.yaml',
	}, { dependsOn: ethernets });
}

if (config.vlan) {
	vlan = runner.run(Netplan, 'vlan', {
		config: Netplan.vlan(config, config.vlan),
		file: '/etc/netplan/69-thecluster-vlan.yaml',
	}, { dependsOn: bond });
}

const kubectl = runner.run(Kubectl, name, {
	arch: config.arch,
	version: config.versions.k8s,
});

const kubeadm = runner.run(Kubeadm, name, {
	arch: config.arch,
	version: config.versions.k8s,
});
