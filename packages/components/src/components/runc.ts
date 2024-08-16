import { ComponentResource, ComponentResourceOptions, Input } from '@pulumi/pulumi';
import { Architecture } from '@unmango/pulumi-kubernetes-the-hard-way/remote';

export interface RuncArgs {
	arch: Architecture;
	version: Input<string>;
}

export class Runc extends ComponentResource {
	constructor(name: string, args: RuncArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:Runc', name, args, opts);
		if (opts?.urn) return;

		// const install = this.exec(RuncInstall, name, {
		// 	architecture: args.arch,
		// 	version: args.version,
		// });

		// this.registerOutputs({
		// 	install,
		// });
	}
}
