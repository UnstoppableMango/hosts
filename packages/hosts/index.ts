import * as pulumi from '@pulumi/pulumi';
import * as config from './config';
// import { getExec, Netplan } from 'host-components';

// const exec = getExec({
// 	host: config.hostname,
// 	privateKey: '',
// });

// let netplan: Netplan | undefined;
// let bond: Netplan | undefined;
// let vlan: Netplan | undefined;

// if (config.ethernets) {
// 	netplan = exec(Netplan, 'ethernets', {
// 		config: Netplan.ethernets(config.ethernets),
// 		file: '/etc/netplan/20-ethernets.yaml',
// 	});
// }

// if (config.bond) {
// 	exec(remote.CopyToRemote, 'systemd-module', {
// 		remotePath: '/etc/modules-load.d/bonding.conf',
// 		source: new pulumi.asset.StringAsset('bonding'),
// 	});

// 	const modprobe = exec(remote.Command, 'modprobe', {
// 		create: 'modprobe bonding',
// 		delete: 'modprobe -r bonding',
// 	});

// 	bond = exec(Netplan, 'bond', {
// 		config: Netplan.bond(config.bond),
// 		file: '/etc/netplan/60-bonding.yaml',
// 	}, { dependsOn: ethernets });
// }

// if (config.vlan) {
// 	this.vlan = exec(Netplan, 'vlan', {
// 		config: Netplan.vlan(config, config.vlan),
// 		file: '/etc/netplan/69-thecluster-vlan.yaml',
// 	}, { dependsOn: bond });
// }

// const archArgs = { arch: config.arch };
// this.kubectl = this.exec(Kubectl, name, archArgs);
// this.kubeadm = this.exec(Kubeadm, name, archArgs);
