import { remote } from '@pulumi/command';
import { ComponentResourceOptions, Input, Inputs, interpolate, Output, output } from '@pulumi/pulumi';
import { Chmod, Tee } from '@unmango/pulumi-commandx/remote';
import * as YAML from 'yaml';
import { NetplanConfig, Network } from '../netplan';
import type { Bond, Node, Vlan } from '../types';
import { CommandComponent, CommandComponentArgs } from './command';

export interface NetplanArgs extends CommandComponentArgs {
	priority: Input<number>;
	name: Input<string>;
	config: Input<Network>;
}

export class Netplan extends CommandComponent {
	public readonly remove!: remote.Command;
	public readonly configTee!: Tee;
	public readonly configChmod!: Chmod;
	public readonly apply!: remote.Command;
	public readonly file!: Output<string>;
	public readonly content!: Output<string>;

	constructor(name: string, args: NetplanArgs, opts?: ComponentResourceOptions) {
		super(`thecluster:infra:Netplan/${name}`, name, args, opts);
		if (opts?.urn) return;

		const file = interpolate`/etc/netplan/${args.priority}-${args.name}.yaml`;
		const remove = this.exec(remote.Command, 'remove-netplan', {
			delete: 'netplan apply',
		});

		const content = output(args.config)
			.apply<NetplanConfig>(network => ({ network }))
			.apply(YAML.stringify);

		const config = this.exec(Tee, 'netplan', {
			stdin: content,
			create: { files: [file] },
			delete: interpolate`rm -f ${file}`,
		}, { dependsOn: remove });

		// TODO: I think this still isn't working
		const chmod = this.exec(Chmod, 'netplan', {
			create: { files: [file], mode: '600' },
		}, { dependsOn: config });

		const apply = this.exec(remote.Command, 'apply-netplan', {
			create: 'netplan apply',
		}, { dependsOn: [config, chmod] });

		this.remove = remove;
		this.file = file;
		this.content = content;
		this.configTee = config;
		this.configChmod = chmod;
		this.apply = apply;

		this.registerOutputs({
			remove: this.remove,
			file: this.file,
			content: this.content,
			configTee: this.configTee,
			configChmod: this.configChmod,
			apply: this.apply,
		});
	}

	public static bond(bond: Bond): Inputs {
		return {
			network: {
				bonds: {
					[bond.name]: {
						interfaces: bond.interfaces,
						addresses: bond.addresses,
						parameters: {
							mode: bond.mode,
							'transmit-hash-policy': 'layer3+4',
							'mii-monitor-interval': 1,
						},
					},
				},
			},
		};
	}

	public static vlan(node: Node, vlan: Vlan): Inputs {
		return {
			network: {
				vlans: {
					[vlan.name]: {
						id: vlan.tag,
						link: vlan.interface,
						addresses: [
							`${node.clusterIp}/16`,
						],
					},
				},
			},
		};
	}
}
