import { remote, types } from '@pulumi/command';
import { Command } from '@pulumi/command/remote';
import { all, CustomResourceOptions, Input, Output, output } from '@pulumi/pulumi';

type MaybeNumber = number | undefined;
type MaybeString = string | undefined;
type OptValue = boolean | MaybeString | MaybeNumber;

interface Opt {
	option: string;
	value: OptValue;
}

export class CommandBuilder {
	private readonly cmd: Output<string[]>;
	private opts: Output<Opt>[] = [];
	private args: Output<string[]> = output([]);

	public get command(): Output<string> {
		const opts = all(this.opts)
			.apply((opts) => opts.filter(x => x.value))
			.apply((opts) => opts.map(toString));

		return all([this.cmd, opts, this.args])
			.apply(([cmd, opts, args]) => [...cmd, ...opts, ...args].join(' '));
	}

	constructor(...cmd: Input<string>[]) {
		this.cmd = all(cmd);
	}

	public arg(arg?: Input<string> | Input<Input<string>[]>): CommandBuilder {
		if (arg) {
			this.args = output(arg)
				.apply(toArray)
				.apply(prepend(this.args));
		}

		return this;
	}

	public option(option: string, value: Input<OptValue>): CommandBuilder {
		const pair: Output<Opt> = output(value).apply(toOpt(option));
		this.opts.push(pair);
		return this;
	}

	public options(option: string, value: Input<OptValue>[]): CommandBuilder {
		throw new Error('TODO');
	}
}

function toArray(x: string | Input<string>[]): Output<string[]> {
	if (typeof x === 'string') {
		return output([x]);
	}

	return x?.length > 0 ? all(x) : output([]);
}

function prepend(a: Input<string[]>): (b: string[]) => Output<string[]> {
	return (b) => output(a).apply(a => [...a, ...b]);
}

function toOpt(option: string): (value: OptValue) => Opt {
	return (value) => ({ option, value });
}

function toString(opt: Opt): string {
	if (typeof opt.value === 'boolean') {
		return opt.value ? opt.option : '';
	}

	return opt.value ? `${opt.option} ${opt.value}` : '';
}

type ApplyInputs<T> = {
	(builder: CommandBuilder, inputs: T): CommandBuilder;
};

type CmdFactory<T> = {
	(name: string, args: CmdInputs<T>, opts?: CustomResourceOptions): remote.Command;
};

interface CmdInputs<T> {
	binaryPath?: string | Input<string>;
	connection: Input<types.input.remote.ConnectionArgs>;
	create?: Input<string> | T;
	delete?: Input<string> | T;
	environment?: Input<Record<string, Input<string>>>;
	stdin?: string | Input<string>;
	triggers?: any[] | Input<any[]>;
	update?: Input<string> | T;
}

export function factory<T>(defaultPath: string, apply: ApplyInputs<T>): CmdFactory<T> {
	return (name, args, opts) => makeCmd(name, args, defaultPath, apply, opts);
}

function makeCmd<T>(
	name: string,
	args: CmdInputs<T>,
	defaultPath: string,
	apply: ApplyInputs<T>,
	opts?: CustomResourceOptions,
): Command {
	const binaryPath = output(args.binaryPath ?? defaultPath);
	const connection = output(args.connection);
	const environment = output(args.environment ?? {});
	const stdin = args.stdin ? output(args.stdin) : undefined;
	const triggers = output(args.triggers ?? []);

	const format = (o?: T | Input<string>): Output<string> | undefined => {
		if (!o) return undefined;
		if (typeof o === 'string' || Output.isInstance(o)) {
			return output(o);
		}
		return apply(new CommandBuilder(binaryPath), o as T).command;
	};

	return new Command(name, {
		connection,
		environment,
		stdin,
		triggers,
		create: format(args.create),
		update: format(args.update),
		delete: format(args.delete),
	}, opts);
}
