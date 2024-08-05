import { ComponentResource, ComponentResourceOptions, Input, interpolate, output } from '@pulumi/pulumi';
import { Architecture } from '@unmango/pulumi-kubernetes-the-hard-way/remote';
import { ArchiveInstall } from './archiveInstall';

export interface CrictlArgs {
	arch: Architecture;
	version: Input<string>;
}

export class Crictl extends ComponentResource {
	public readonly install!: ArchiveInstall;

	constructor(name: string, args: CrictlArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:Crictl', name, args, opts);
		if (opts?.urn) return;

    const architecture = output(args.arch);
    const version = output(args.version);
    const directory = output('/usr/local/bin');
    const archiveName = interpolate`crictl-v${version}-linux-${architecture}.tar.gz`;
    const url = interpolate`https://github.com/kubernetes-sigs/cri-tools/releases/download/v${version}/crictl-v${version}-linux-${architecture}.tar.gz`;

		const install = new ArchiveInstall(name, {
			archiveName,
			url,
			directory,
			stripComponents: 1,
			files: ['crictl'],
		}, { parent: this });

		this.install = install;

		this.registerOutputs({
			install,
		});
	}
}
