import { remote } from '@pulumi/command/types/input';
import { ComponentResourceOptions, CustomResourceOptions, Input } from '@pulumi/pulumi';

export type AnyOpts = CustomResourceOptions | ComponentResourceOptions;

export type HasConnection = object & { connection: Input<remote.ConnectionArgs> };
export type RunArgs<T extends HasConnection> = Omit<T, 'connection'>;
export type RunOpts<T extends AnyOpts> = Omit<T, 'parent'>;

export type RemoteResource<T, U extends HasConnection, V extends AnyOpts> = {
	new(name: string, args: U, opts?: V): T;
};
