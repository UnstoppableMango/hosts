import { ComponentResourceOptions, Input } from '@pulumi/pulumi';
import { Chmod } from '@unmango/pulumi-commandx/remote';
import { Architecture, KubectlInstall } from '@unmango/pulumi-kubernetes-the-hard-way/remote';
import { CommandComponent, CommandComponentArgs } from './command';

export interface KubectlArgs extends CommandComponentArgs {
	arch: Architecture;
	version: Input<string>;
}

export class Kubectl extends CommandComponent {
	constructor(name: string, args: KubectlArgs, opts?: ComponentResourceOptions) {
		super(`thecluster:infra:Kubectl/${name}`, name, args, opts);
		if (opts?.urn) return;

		const install = this.exec(KubectlInstall, name, {
			architecture: args.arch,
			version: args.version,
		});

		const chmod = this.exec(Chmod, name, {
			create: {
				mode: '+x',
				files: [install.path],
			},
		});
	}
}
