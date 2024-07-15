import { remote } from '@pulumi/command/types/input';
import { ComponentResourceOptions, CustomResourceOptions, Input } from '@pulumi/pulumi';

export const URI = 'Connection';
export type URI = typeof URI;

declare module 'fp-ts/HKT' {
	interface URItoKind<A> {
		readonly Connection: Connection<A>;
	}
}

type HasConnection = object & { connection: Input<remote.ConnectionArgs> };
type RunArgs<T extends HasConnection> = Omit<T, 'connection'>;
type AnyOpts = CustomResourceOptions | ComponentResourceOptions;
type RunOpts<T extends AnyOpts> = Omit<T, 'parent'>;

type RemoteResource<T, U extends HasConnection, V extends AnyOpts> = {
	new(name: string, args: U, opts?: V): T;
};

export type Connection<A> = {
	(connection: remote.ConnectionArgs): A;
};

export const of = <T, U extends HasConnection, V extends AnyOpts>(
	Resource: RemoteResource<T, U, V>,
	name: string,
	args: RunArgs<U>,
	opts?: RunOpts<V>,
): Connection<T> => {
	return (c) => new Resource(name, { ...args, connection: c }, opts);
};
