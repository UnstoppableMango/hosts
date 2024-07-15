import { ComponentResourceOptions, Input, interpolate, Output, output } from '@pulumi/pulumi';
import { CommandComponent, CommandComponentArgs } from './command';

export interface DirectoryArgs extends CommandComponentArgs {
	path: Input<string>;
}

export class Directory extends CommandComponent {
	public readonly path!: Output<string>;

	constructor(name: string, args: DirectoryArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:Directory', name, args, opts);
		if (opts?.urn) return;

		const path = output(args.path);

		const mkdir = this.cmd(name, {
			create: interpolate`mkdir -p ${path}`,
		});

		this.path = path;

		this.registerOutputs({
			path,
		});
	}
}
