import { ComponentResourceOptions } from '@pulumi/pulumi';
import { Architecture, CrictlInstall } from '@unmango/pulumi-kubernetes-the-hard-way/remote';
import { versions } from '../config';
import { CommandComponent, CommandComponentArgs } from './command';

export interface CrictlArgs extends CommandComponentArgs {
	arch: Architecture;
}

export class Crictl extends CommandComponent {
	constructor(name: string, args: CrictlArgs, opts?: ComponentResourceOptions) {
		super(`thecluster:infra:Crictl/${name}`, name, args, opts);
		if (opts?.urn) return;

		this.exec(CrictlInstall, 'crictl', {
			architecture: args.arch,
			version: versions.crictl,
		});
	}
}
