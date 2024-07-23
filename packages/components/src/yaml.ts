import { Inputs, Output, output } from '@pulumi/pulumi';
import * as YAML from 'yaml';

export function stringify(value: Inputs): Output<string> {
	return output(value).apply(YAML.stringify);
}
