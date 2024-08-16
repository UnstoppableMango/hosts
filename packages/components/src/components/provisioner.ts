import { ComponentResource, ComponentResourceOptions, Input, interpolate, Output, output } from '@pulumi/pulumi';
import { Architecture } from '@unmango/pulumi-kubernetes-the-hard-way/remote';

export interface ProvisionerArgs {
	arch: Architecture;
	version: Input<string>;
	listenIp: Input<string>;
	systemdDirectory: Input<string>;
}

export class Provisioner extends ComponentResource {
	public readonly manifestDir!: Output<string>;

	constructor(name: string, args: ProvisionerArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:Provisioner', name, args, opts);
		if (opts?.urn) return;

		const version = output(args.version);
		const arch = output(args.arch ?? 'amd64');
		const serviceName = output('baremetal-provisioner');
		const systemdDirectory = output(args.systemdDirectory);

		const archiveName = interpolate`pulumi-resource-baremetal-v${version}-linux-${arch}.tar.gz`;
		const url = interpolate`https://github.com/unmango/pulumi-baremetal/releases/download/v${version}`;

		// const install = this.exec(ArchiveInstall, 'bin', {
		// 	url: interpolate`${url}/${archiveName}`,
		// 	archiveName: archiveName,
		// 	binName: 'provisioner',
		// });

		// const systemdService = this.tee('systemd-service', {
		// 	path: interpolate`${systemdDirectory}/${serviceName}.service`,
		// 	content: systemd.stringify({
		// 		unit: {
		// 			description: 'The Pulumi Bare Metal Provisioner',
		// 			documentation: ['https://github.com/unmango/pulumi-baremetal'],
		// 			wants: ['network-online.target'],
		// 			after: ['network-online.target'],
		// 		},
		// 		service: {
		// 			execStart: all([
		// 				install.path,
		// 				interpolate`--verbose`,
		// 				interpolate`--address ${args.listenIp}:6969`,
		// 			]).apply(x => x.join(' ')),
		// 			restart: 'always',
		// 			restartSec: '10',
		// 			startLimitInterval: '0',
		// 		},
		// 		install: {
		// 			wantedBy: ['multi-user.target'],
		// 		},
		// 	}),
		// });

		// const start = this.cmd('start', {
		// 	create: interpolate`systemctl daemon-reload && systemctl enable --now ${serviceName}`,
		// 	delete: interpolate`systemctl disable --now ${serviceName}`,
		// 	triggers: [systemdService.stdin],
		// }, {
		// 	dependsOn: [
		// 		install,
		// 		systemdService,
		// 	],
		// });

		// this.registerOutputs({
		// 	install,
		// 	systemdService,
		// 	enable: start,
		// });
	}
}
