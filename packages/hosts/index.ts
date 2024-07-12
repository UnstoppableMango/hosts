import * as pulumi from '@pulumi/pulumi';
import { remote } from '@pulumi/command';
import * as config from './config';
import { Runner, Netplan, Kubeadm, Kubectl } from 'components';

const runner = new Runner({
	host: config.hostname,
	privateKey: 'TODO',
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

const archArgs = { arch: config.arch };
const kubectl = runner.run(Kubectl, name, archArgs);
const kubeadm = runner.run(Kubeadm, name, archArgs);
