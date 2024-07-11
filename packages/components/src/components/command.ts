import { remote as inputs } from '@pulumi/command/types/input';
import {
	ComponentResource,
	ComponentResourceOptions,
	CustomResourceOptions,
	Input,
	Output,
	output,
	Resource,
} from '@pulumi/pulumi';

type HasConnection = object & { connection: Input<inputs.ConnectionArgs> };
type RunArgs<T extends HasConnection> = Omit<T, 'connection'>;
type AnyOpts = CustomResourceOptions | ComponentResourceOptions;
type RunOpts<T extends AnyOpts> = Omit<T, 'parent'>;

type RemoteResource<T, V extends HasConnection> = {
	new(name: string, args: V, opts?: AnyOpts): T;
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
		ctor: RemoteResource<T, U>,
		name: string,
		args: RunArgs<U>,
		opts?: RunOpts<V>,
	): T {
		const withConnection: U = Object.create({ ...args, connection: this.connection });
		return new ctor(name, withConnection, { ...opts, parent: this });
	}
}
