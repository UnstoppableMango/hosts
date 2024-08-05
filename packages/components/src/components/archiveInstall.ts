import { ComponentResourceOptions, Input, interpolate, Output, output } from '@pulumi/pulumi';
import { CommandComponent, CommandComponentArgs } from './command';
import { Download } from './download';
import { remote } from '@pulumi/command';

export interface ArchiveInstallArgs extends CommandComponentArgs {
	archiveName: Input<string>;
	binName: Input<string>;
	directory?: Input<string>;
	url: Input<string>;
}

export class ArchiveInstall extends CommandComponent {
	public readonly dir!: Output<string>;
	public readonly path!: Output<string>;
	public readonly download!: Download;
	public readonly tar!: remote.Command;

	constructor(name: string, args: ArchiveInstallArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:ArchiveInstall', name, args, opts);
		if (opts?.urn) return;

		const binDir = output(args.directory ?? '/usr/local/bin');
		const binName = output(args.binName);
		const binPath = interpolate`${binDir}/${binName}`;

		const download = this.exec(Download, name, { url: args.url });
		const binMkdir = this.cmd('bin-mkdir', {
			create: interpolate`mkdir -p ${binDir}`,
		});

		const tar = this.cmd('tar', {
			create: interpolate`tar -C ${binDir} -zxvf ${download.path} ${binName}`,
			delete: interpolate`rm -f ${binPath}`,
			triggers: [binDir, download.path, binName],
		}, { dependsOn: [binMkdir, download] });

		this.dir = binDir;
		this.download = download;
		this.tar = tar;
		this.path = binPath;

		this.registerOutputs({
			dir: this.dir,
			download: this.download,
			tar: this.tar,
			path: this.path,
		});
	}
}
