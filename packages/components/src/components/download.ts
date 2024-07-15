import { ComponentResourceOptions, Input, interpolate, Output, output } from '@pulumi/pulumi';
import { basename } from 'node:path';
import { CommandComponent, CommandComponentArgs } from './command';

export interface DownloadArgs extends CommandComponentArgs {
	readonly url: Input<string>;
}

export class Download extends CommandComponent {
	public readonly path!: Output<string>;

	constructor(name: string, args: DownloadArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:Download', name, args, opts);
		if (opts?.urn) return;

		const url = output(args.url);
		const binName = url.apply(basename);

		const dir = this.mktemp('mktemp', { triggers: [url] });
		const dirName = dir.stdout;
		const path = interpolate`${dirName}/${binName}`;

		const wget = this.wget('wget', {
			url: args.url,
			destination: dirName,
		}, { dependsOn: dir });

		this.path = path;

		this.registerOutputs({ dir, path, wget });
	}
}
