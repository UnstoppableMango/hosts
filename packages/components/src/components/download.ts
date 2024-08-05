import { ComponentResource, ComponentResourceOptions, Input, interpolate, Output, output } from '@pulumi/pulumi';
import { Mktemp, Wget } from '@unmango/baremetal/coreutils';
import { basename } from 'node:path';

export interface DownloadArgs {
	readonly url: Input<string>;
}

export class Download extends ComponentResource {
	public readonly path!: Output<string>;
	public readonly url!: Output<string>;
	public readonly dir!: Mktemp;
	public readonly dl!: Wget;

	constructor(name: string, args: DownloadArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:Download', name, args, opts);
		if (opts?.urn) return;

		const url = output(args.url);
		const binName = url.apply(basename);

		const dir = new Mktemp('mktemp', {
			args: {
				directory: true,
			},
		}, { parent: this });

		const dirName = dir.stdout.apply(x => x.trim());
		const path = interpolate`${dirName}/${binName}`;

		const wget = new Wget('wget', {
			args: {
				urls: [args.url],
				directoryPrefix: dirName,
			},
		}, { parent: this, dependsOn: dir });

		this.dir = dir;
		this.dl = wget;
		this.path = path;
		this.url = url;

		this.registerOutputs({
			dir,
			dl: this.dl,
			path,
			url,
		});
	}
}
