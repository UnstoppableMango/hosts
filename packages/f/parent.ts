import { Resource } from '@pulumi/pulumi';
import { AnyOpts } from './remoteResource';

export const URI = 'Parent';
export type URI = typeof URI;

declare module 'fp-ts/HKT' {
	interface URItoKind<A> {
		readonly Parent: Parent<A>;
	}
}

export type Parent<T> = {
	(partial: T): T;
};

export const child = <T extends AnyOpts>(parent: Resource): Parent<T> => {
	return (opts) => ({ ...opts, parent });
};
