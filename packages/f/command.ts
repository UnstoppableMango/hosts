import { remote } from '@pulumi/command';
import { Resource } from '@pulumi/pulumi';
import * as A from './args';
import * as P from './parent';
import { AnyOpts, HasConnection, RemoteResourceConstructor } from './remoteResource';

export const URI = 'Command';
export type URI = typeof URI;

declare module 'fp-ts/HKT' {
	interface URItoKind<A> {
		readonly Command: Command<A>;
	}
}

export type Command<T> = {
	(name: string, args: A.Args<T>, opts?: P.Parent<T>): T;
};

export const of = <T, U extends HasConnection, V extends AnyOpts>(
	ctor: RemoteResourceConstructor<T, U, V>,
): Command<T> => {
	return (name, args, opts) => new ctor(name);
};

const a = A.connect({ host: '' });
const o = P.child({} as Resource);
const temp = of(remote.Command)('', a, o);
