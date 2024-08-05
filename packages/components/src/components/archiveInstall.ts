import { ComponentResource, ComponentResourceOptions, Input, Output, output } from '@pulumi/pulumi';
import { Download } from './download';
import { Mkdir, Tar } from '@unmango/baremetal/coreutils';

export interface ArchiveInstallArgs {
	files: string[];
	archiveName: Input<string>;
	directory?: Input<string>;
	url: Input<string>;
	stripComponents?: Input<number>;
}

export class ArchiveInstall extends ComponentResource {
	public readonly dir!: Output<string>;
	public readonly path!: Output<string>;
	public readonly download!: Download;
	public readonly tar!: Tar;

	constructor(name: string, args: ArchiveInstallArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:ArchiveInstall', name, args, opts);
		if (opts?.urn) return;

		const binDir = output(args.directory ?? '/usr/local/bin');

		const download = new Download(name, {
			url: args.url,
		}, { parent: this });

		const binMkdir = new Mkdir('bin-mkdir', {
			args: {
				directory: [binDir],
				parents: true,
			},
		}, { parent: this });

		const tar = new Tar('tar', {
			args: {
				extract: true,
				gzip: true,
				verbose: true,
				args: args.files,
				file: download.path,
				directory: binDir,
				stripComponents: args.stripComponents,
			},
		}, { parent: this, dependsOn: [binMkdir, download] })

		this.dir = binDir;
		this.download = download;
		this.tar = tar;

		this.registerOutputs({
			dir: this.dir,
			download: this.download,
			tar: this.tar,
			path: this.path,
		});
	}
}
