import { remote } from '@pulumi/command';
import { ComponentResourceOptions, Input, interpolate, Output, output } from '@pulumi/pulumi';
import * as YAML from 'yaml';
import { NetplanConfig, Network } from '../netplan';
import { CommandComponent, CommandComponentArgs } from './command';

export interface NetplanArgs extends CommandComponentArgs {
	priority: Input<number>;
	name: Input<string>;
	config: Input<Network>;
}

export class Netplan extends CommandComponent {
	public readonly remove!: remote.Command;
	public readonly configTee!: remote.Command;
	public readonly configChmod!: remote.Command;
	public readonly apply!: remote.Command;
	public readonly file!: Output<string>;
	public readonly content!: Output<string>;

	constructor(name: string, args: NetplanArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:Netplan', name, args, opts);
		if (opts?.urn) return;

		const file = interpolate`/etc/netplan/${args.priority}-${args.name}.yaml`;
		const remove = this.cmd('remove-netplan', {
			delete: 'netplan apply',
		});

		const content = output(args.config)
			.apply<NetplanConfig>(network => ({ network }))
			.apply(YAML.stringify);

		const config = this.tee(`config-tee`, {
			content: content,
			path: file,
		}, { dependsOn: remove });

		const chmod = this.chmod('config-chmod', {
			mode: '600',
			path: file,
		}, { dependsOn: config });

		const apply = this.cmd('apply-netplan', {
			create: 'netplan apply',
			triggers: [config.stdin],
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

	// public static bond(bond: Bond): Inputs {
	// 	return {
	// 		network: {
	// 			bonds: {
	// 				[bond.name]: {
	// 					interfaces: bond.interfaces,
	// 					addresses: bond.addresses,
	// 					parameters: {
	// 						mode: bond.mode,
	// 						'transmit-hash-policy': 'layer3+4',
	// 						'mii-monitor-interval': 1,
	// 					},
	// 				},
	// 			},
	// 		},
	// 	};
	// }
}
