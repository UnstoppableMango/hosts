import { ComponentResourceOptions, Input } from '@pulumi/pulumi';
import { Architecture, CrictlInstall } from '@unmango/pulumi-kubernetes-the-hard-way/remote';
import { CommandComponent, CommandComponentArgs } from './command';

export interface CrictlArgs extends CommandComponentArgs {
	arch: Architecture;
	version: Input<string>;
}

export class Crictl extends CommandComponent {
	constructor(name: string, args: CrictlArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:Crictl', name, args, opts);
		if (opts?.urn) return;

		const install = this.exec(CrictlInstall, name, {
			architecture: args.arch,
			version: args.version,
		});

		this.registerOutputs({
			install,
		});
	}
}
