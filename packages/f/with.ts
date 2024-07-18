import { AnyOpts, HasConnection } from './remoteResource';
import { Kind, URIS } from 'fp-ts/HKT';

export interface With<F extends URIS> {
	readonly URI: F;
	readonly with: <A, B extends keyof A>(fa: Kind<F, A>) => A;
}

// export type With<T, K extends keyof T> = {
// 	(partial: Omit<T, K>): T;
// };

// export const of = <T, U extends keyof T>(key: U, value: T[U]): With<T, U> => {
// 	return (partial) => Object.create({ ...partial, [key]: value });
// };

// export const connect = <T extends HasConnection>(connection: T['connection']): With<T, 'connection'> => {
// 	return of<T, 'connection'>('connection', connection);
// };

// export const parent = <T extends AnyOpts>(parent: T['parent']): With<T, 'parent'> => {
// 	return of<T, 'parent'>('parent', parent);
// };
