import { ComponentResourceOptions } from '@pulumi/pulumi';
import { Chmod } from '@unmango/pulumi-commandx/remote';
import { Architecture, KubectlInstall } from '@unmango/pulumi-kubernetes-the-hard-way/remote';
import { versions } from '../config';
import { CommandComponent, CommandComponentArgs } from './command';

export interface KubectlArgs extends CommandComponentArgs {
	arch: Architecture;
}

export class Kubectl extends CommandComponent {
	constructor(name: string, args: KubectlArgs, opts?: ComponentResourceOptions) {
		super(`thecluster:infra:Kubectl/${name}`, name, args, opts);
		if (opts?.urn) return;

		const install = this.exec(KubectlInstall, name, {
			architecture: args.arch,
			version: versions.k8s,
		});

		const chmod = this.exec(Chmod, name, {
			create: {
				mode: '+x',
				files: [install.path],
			},
		});
	}
}
