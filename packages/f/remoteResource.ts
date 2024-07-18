import { remote } from '@pulumi/command/types/input';
import { ComponentResourceOptions, CustomResourceOptions, Input } from '@pulumi/pulumi';

export type AnyOpts = CustomResourceOptions | ComponentResourceOptions;

export type ConnectionArgs = remote.ConnectionArgs | Input<remote.ConnectionArgs>;
export type HasConnection = object & { connection: ConnectionArgs };

// export type RunArgs<T extends HasConnection> = Omit<T, 'connection'>;
// export type RunOpts<T extends AnyOpts> = Omit<T, 'parent'>;

export type RemoteResourceConstructor<T, U extends HasConnection, V extends AnyOpts> = {
	new(name: string, args: U, opts?: V): T;
};

export type RemoteResourceArgs<T> = T extends RemoteResourceConstructor<T, infer U, infer _V> ? U : never;
export type RemoteResourceOpts<T> = T extends RemoteResourceConstructor<T, infer _U, infer V> ? V : never;
