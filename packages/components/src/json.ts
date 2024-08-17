import { Inputs, Output, output } from '@pulumi/pulumi';

export function stringify(value: Inputs): Output<string> {
	return output(value).apply(JSON.stringify);
}
