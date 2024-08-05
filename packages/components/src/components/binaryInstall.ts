import { ComponentResource, ComponentResourceOptions, Input, interpolate, Output, output } from '@pulumi/pulumi';
import { Download } from './download';
import { Chmod, Mkdir, Mv } from '@unmango/baremetal/coreutils';

export interface BinaryInstallArgs {
	binName: Input<string>;
	directory?: Input<string>;
	url: Input<string>;
}

export class BinaryInstall extends ComponentResource {
	public readonly path!: Output<string>;

	constructor(name: string, args: BinaryInstallArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:BinaryInstall', name, args, opts);
		if (opts?.urn) return;

		const binDir = output(args.directory ?? '/usr/local/bin');
		const binName = output(args.binName);
		const binPath = interpolate`${binDir}/${binName}`;

		const download = new Download(name, {
			url: args.url,
		}, { parent: this });

		const binMkdir = new Mkdir('bin-mkdir', {
			args: {
				directory: [binDir],
				parents: true,
			},
		}, { parent: this });

		const binMv = new Mv('bin-mv', {
			args: {
				source: [download.path],
				destination: binPath,
			},
		}, {
			parent: this,
			dependsOn: [download, binMkdir],
		});

		const chmod = new Chmod('bin-chmod', {
			args: {
				mode: ['+x'],
				files: [binPath],
			},
			triggers: [download.path],
		}, { parent: this, dependsOn: binMv });

		this.path = binPath;

		this.registerOutputs({
			path: binPath,
		});
	}
}
