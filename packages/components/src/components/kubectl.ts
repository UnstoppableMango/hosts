import { ComponentResource, ComponentResourceOptions, Input, interpolate, output } from '@pulumi/pulumi';
import { Architecture } from '@unmango/pulumi-kubernetes-the-hard-way/remote';
import { BinaryInstall } from './binaryInstall';
import { Chmod } from '@unmango/baremetal/coreutils';

export interface KubectlArgs {
	arch: Architecture;
	version: Input<string>;
}

export class Kubectl extends ComponentResource {
	constructor(name: string, args: KubectlArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:Kubectl', name, args, opts);
		if (opts?.urn) return;

    const architecture = output(args.arch);
    const binName = 'kubectl';
    const directory = output('/usr/local/bin');
    const version = output(args.version);
    const url = interpolate`https://dl.k8s.io/release/v${version}/bin/linux/${architecture}/${binName}`;

		const install = new BinaryInstall(name, {
			url,
			directory,
			binName,
		}, { parent: this });

		const chmod = new Chmod('bin-chmod', {
			args: {
				files: [install.path],
				mode: ['+x'],
			},
		}, { parent: this });

		this.registerOutputs({
			install,
			chmod,
		});
	}
}
