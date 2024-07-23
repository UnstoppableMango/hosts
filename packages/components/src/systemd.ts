import { Input, Output, output } from '@pulumi/pulumi';
import * as kthw from '@unmango/pulumi-kubernetes-the-hard-way/remote';

type R = Required<kthw.SystemdServiceArgs>;

type Unit = R['unit'];
type Service = R['service'] & {
	environmentFile?: Input<Input<string>[]>;
	startLimitInterval?: Input<string>;
};
type Install = R['install'];

export interface SystemdServiceArgs {
	unit: Unit;
	service: Service;
	install: Install;
}

export function stringify(input: SystemdServiceArgs): Output<string> {
	return output(input).apply(({ unit, service, install }) => {
		return `# DO NOT MODIFY - Managed by Pulumi
[Unit]
${sprint(unit)}

[Service]
${sprint(service)}

[Install]
${sprint(install)}
`;
	});
}

function sprint(value: Record<string, unknown>): string {
	return Object.entries(value)
		.map(([k, v]) => `${capitalize(k)}=${v}`)
		.join('\n');
}

function capitalize(s: string): string {
	return s[0].toUpperCase() + s.slice(1);
}
