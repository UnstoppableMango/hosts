import { ComponentResource, ComponentResourceOptions, Input, Output, output } from '@pulumi/pulumi';
import { Mkdir } from '@unmango/baremetal/coreutils';

export interface DirectoryArgs {
	path: Input<string>;
}

export class Directory extends ComponentResource {
	public readonly op!: Mkdir;
	public readonly path!: Output<string>;

	constructor(name: string, args: DirectoryArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:Directory', name, args, opts);
		if (opts?.urn) return;

		const path = output(args.path);

		const mkdir = new Mkdir(name, {
			args: {
				directory: [path],
				parents: true,
			},
		}, { parent: this });

		this.op = mkdir;
		this.path = path;

		this.registerOutputs({
			op: mkdir,
			path,
		});
	}
}
