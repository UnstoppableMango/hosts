import { ComponentResource, ComponentResourceOptions, Input, interpolate, Output, output } from '@pulumi/pulumi';
import { basename } from 'node:path';
import { Mktemp, Wget } from '@unmango/baremetal/cmd';

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
			directory: true,
		}, { parent: this });

		const dirName = dir.stdout;
		const path = interpolate`${dirName}/${binName}`;

		const wget = new Wget('wget', {
			urls: [args.url],
			directoryPrefix: dirName,
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
