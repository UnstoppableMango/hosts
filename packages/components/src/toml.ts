import { all, Inputs, Output, output } from '@pulumi/pulumi';

export function stringify(value: Inputs): Output<string> {
	const TOML = output(import('smol-toml')); // Whyyyy
	return all([value, TOML]).apply(([v, TOML]) => TOML.stringify(v));
}
