import { Output } from '@pulumi/pulumi';
import { Functor1 } from 'fp-ts/Functor';

export const URI = 'Output';
export type URI = typeof URI;

declare module 'fp-ts/HKT' {
	interface URItoKind<A> {
		readonly Output: Output<A>;
	}
}

export const Functor: Functor1<URI> = {
	URI,
	map: (output, f) => output.apply(f),
};
