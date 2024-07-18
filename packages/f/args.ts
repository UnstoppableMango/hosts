import { remote } from '@pulumi/command/types/input';
import { HasConnection } from './remoteResource';

export const URI = 'Args';
export type URI = typeof URI;

declare module 'fp-ts/HKT' {
	interface URItoKind<A> {
		readonly Args: Args<A>;
	}
}

export type Args<T> = {
	(partial: T): T;
};

export const connect = <T extends HasConnection>(
	connection: remote.ConnectionArgs,
): Args<T> => {
	return (args) => ({ ...args, connection });
};
