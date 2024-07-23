import { ComponentResourceOptions, Input, interpolate, Output, output } from '@pulumi/pulumi';
import { CommandComponent, CommandComponentArgs } from './command';
import { Download } from './download';

export interface BinaryInstallArgs extends CommandComponentArgs {
	binName: Input<string>;
	directory?: Input<string>;
	url: Input<string>;
}

export class BinaryInstall extends CommandComponent {
	public readonly path!: Output<string>;

	constructor(name: string, args: BinaryInstallArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:BinaryInstall', name, args, opts);
		if (opts?.urn) return;

		const binDir = output(args.directory ?? '/usr/local/bin');
		const binName = output(args.binName);
		const binPath = interpolate`${binDir}/${binName}`;

		const download = this.exec(Download, name, { url: args.url });
		const binMkdir = this.cmd('bin-mkdir', {
			create: interpolate`mkdir -p ${binDir}`,
		});

		const binMv = this.cmd('bin-mv', {
			create: interpolate`mv ${download.path} ${binPath}`,
			delete: interpolate`rm -f ${binPath}`,
		}, {
			dependsOn: [download, binMkdir],
			deleteBeforeReplace: true,
		});

		const chmod = this.chmod('bin-chmod', {
			mode: '+x',
			path: binPath,
		}, { dependsOn: binMv });

		this.path = binPath;

		this.registerOutputs({
			path: binPath,
		});
	}
}
