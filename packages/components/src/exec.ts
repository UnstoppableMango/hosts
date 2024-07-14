import { remote as inputs } from '@pulumi/command/types/input';
import { ComponentResourceOptions, CustomResourceOptions, Input, Resource } from '@pulumi/pulumi';

type HasConnection = object & { connection: Input<inputs.ConnectionArgs> };
type RunArgs<T extends HasConnection> = Omit<T, 'connection'>;
type AnyOpts = CustomResourceOptions | ComponentResourceOptions;
type RunOpts<T extends AnyOpts> = Omit<T, 'parent'>;

type RemoteResource<T, V extends HasConnection> = {
	new(name: string, args: V, opts?: AnyOpts): T;
};

export type Run<T extends Resource, U extends HasConnection, V extends AnyOpts> = {
	(ctor: RemoteResource<T, U>, name: string, args: RunArgs<U>, opts?: RunOpts<V>): T;
};

export class Runner {
	constructor(private connection: inputs.ConnectionArgs) {}
	run<T extends Resource, U extends HasConnection, V extends AnyOpts>(
		ctor: RemoteResource<T, U>,
		name: string,
		args: RunArgs<U>,
		opts?: RunOpts<V>,
	): T {
		const withConnection = Object.create({ ...args, connection: this.connection });
		return new ctor(name, withConnection, opts);
	}
}
