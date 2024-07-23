import { remote } from '@pulumi/command';
import { remote as inputs } from '@pulumi/command/types/input';
import {
	ComponentResource,
	ComponentResourceOptions,
	CustomResourceOptions,
	Input,
	interpolate,
	log,
	Output,
	output,
	Resource,
} from '@pulumi/pulumi';

type HasConnection = object & { connection: Input<inputs.ConnectionArgs> };
type RunArgs<T extends HasConnection> = Omit<T, 'connection'>;
type AnyOpts = CustomResourceOptions | ComponentResourceOptions;
type RunOpts<T extends AnyOpts> = Omit<T, 'parent'>;

type RemoteResource<T, U extends HasConnection, V extends AnyOpts> = {
	new(name: string, args: U, opts?: V): T;
};

export interface CommandComponentArgs {
	connection: Input<inputs.ConnectionArgs>;
}

export abstract class CommandComponent extends ComponentResource {
	private readonly connection: Output<inputs.ConnectionArgs>;

	constructor(type: string, name: string, args: CommandComponentArgs, opts?: ComponentResourceOptions) {
		super(type, name, args, opts);
		this.connection = output(args.connection);
	}

	protected exec<T extends Resource, U extends HasConnection, V extends AnyOpts>(
		ctor: RemoteResource<T, U, V>,
		name: string,
		args: RunArgs<U>,
		opts?: RunOpts<V>,
	): T {
		const withConnection: U = { ...args, connection: this.connection } as U;
		const withParent: V = { ...opts, parent: this } as unknown as V;
		return new ctor(name, withConnection, withParent);
	}

	protected cmd(name: string, args: RunArgs<remote.CommandArgs>, opts?: CustomResourceOptions): remote.Command {
		return this.exec(remote.Command, name, args, opts);
	}

	protected chmod(
		name: string,
		args: { mode: Input<string>; path: Input<string> },
		opts?: CustomResourceOptions,
	): remote.Command {
		return this.cmd(name, {
			create: interpolate`chmod ${args.mode} ${args.path}`,
		}, opts);
	}

	protected mkdir(name: string, path: Input<string>, opts?: CustomResourceOptions): remote.Command {
		return this.exec(remote.Command, name, {
			create: interpolate`mkdir -p ${path}`,
			delete: interpolate`rm -rf ${path}`,
			triggers: [path],
		}, { deleteBeforeReplace: true, ...opts });
	}

	protected mktemp(
		name: string,
		args?: { triggers: Input<any[]> },
		opts?: CustomResourceOptions,
	): remote.Command {
		return this.cmd(name, {
			create: interpolate`mktemp --directory`,
			triggers: args?.triggers,
		}, opts);
	}

	protected tee(
		name: string,
		args: { path: Input<string>; content: Input<string>; secret?: boolean },
		opts?: CustomResourceOptions,
	): remote.Command {
		return this.exec(remote.Command, name, {
			stdin: args.content,
			create: interpolate`tee ${args.path}`,
			delete: interpolate`rm -f ${args.path}`,
			triggers: [args.path],
			logging: args.secret ? 'stderr' : undefined,
		}, { deleteBeforeReplace: true, ...opts });
	}

	protected wget(
		name: string,
		args: { url: Input<string>; destination: Input<string>; delete?: Input<string> },
		opts?: CustomResourceOptions,
	): remote.Command {
		return this.cmd(name, {
			create: interpolate`wget --directory-prefix ${args.destination} ${args.url}`,
			delete: args.delete,
			triggers: [args.destination, args.url, args.delete],
		}, { deleteBeforeReplace: true, ...opts });
	}
}
