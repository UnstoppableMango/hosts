import { ComponentResourceOptions, Input } from '@pulumi/pulumi';
import { Architecture, RuncInstall } from '@unmango/pulumi-kubernetes-the-hard-way/remote';
import { CommandComponent, CommandComponentArgs } from './command';

export interface RuncArgs extends CommandComponentArgs {
	arch: Architecture;
	version: Input<string>;
}

export class Runc extends CommandComponent {
	constructor(name: string, args: RuncArgs, opts?: ComponentResourceOptions) {
		super(`thecluster:infra:Runc/${name}`, name, args, opts);
		if (opts?.urn) return;

		this.exec(RuncInstall, 'runc', {
			architecture: args.arch,
			version: args.version,
		});
	}
}
