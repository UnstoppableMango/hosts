import { remote } from '@pulumi/command';
import { remote as inputs } from '@pulumi/command/types/input';

export const URI = 'Command';
export type URI = typeof URI;

declare module 'fp-ts/HKT' {
	interface URItoKind<A> {
		readonly Command: Command<A>;
	}
}

export type Command<T> = {
	(connection: inputs.ConnectionArgs): remote.Command;
};
