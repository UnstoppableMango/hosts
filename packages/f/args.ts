import { HasConnection } from './remoteResource';
import * as W from './with';

export const URI = 'Args';
export type URI = typeof URI;

declare module 'fp-ts/HKT' {
	interface URItoKind<A> {
		readonly Args: Args<A>;
	}
}

export type Args<T> = T extends HasConnection ? W.With<T, 'connection'> : never;

export const connect = <T extends HasConnection>(
	connection: T['connection'],
): W.With<T, 'connection'> => {
	return W.of<T, 'connection'>('connection', connection);
};
