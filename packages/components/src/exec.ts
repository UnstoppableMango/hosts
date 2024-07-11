// export type Exec<T extends Resource, U extends HasConnection, V extends AnyOpts> = {
// 	(ctor: RemoteResource<T, U>, name: string, args: RunArgs<U>, opts?: RunOpts<V>): T;
// };

// export function getExec<T extends Resource, U extends HasConnection, V extends AnyOpts>(
// 	connection: inputs.ConnectionArgs,
// ): Exec<T, U, V> {
// 	return (ctor, name, args, opts) => {
// 		return new ctor(name, Object.create({ ...args, connection }), opts);
// 	};
// }

// export function getExec(
// 	connection: inputs.ConnectionArgs,
// ): Exec<T, U, V> {
// 	return (ctor, name, args, opts) => {
// 		return new ctor(name, Object.create({ ...args, connection }), opts);
// 	};
// }
