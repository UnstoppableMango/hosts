import { ComponentResourceOptions, Input, Output } from '@pulumi/pulumi';
import { Architecture, CniPluginsInstall } from '@unmango/pulumi-kubernetes-the-hard-way/remote';
import { CommandComponent, CommandComponentArgs } from './command';

export interface CniPluginsArgs extends CommandComponentArgs {
	arch: Architecture;
	version: Input<string>;
}

export class CniPlugins extends CommandComponent {
	public readonly directory!: Output<string>;

	constructor(name: string, args: CniPluginsArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:CniPlugins', name, args, opts);
		if (opts?.urn) return;

		const directory = '/opt/cni/bin';

		const mkdir = this.mkdir('bin-mkdir', directory);
		const install = this.exec(CniPluginsInstall, name, {
			architecture: args.arch,
			directory,
			version: args.version,
		}, { dependsOn: mkdir });

		this.directory = install.directory;

		this.registerOutputs({
			directory: this.directory,
			install,
		});
	}
}
