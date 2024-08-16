import { ComponentResource, ComponentResourceOptions, Input, interpolate, Output, output } from '@pulumi/pulumi';
import { Mkdir, Tee } from '@unmango/baremetal/coreutils';
import { Architecture } from '@unmango/pulumi-kubernetes-the-hard-way/remote';
import * as fs from 'node:fs/promises';
import { ArchiveInstall } from './archiveInstall';

export interface ContainerdArgs {
	arch: Architecture;
	systemdDirectory: Input<string>;
	version: Input<string>;
}

export class Containerd extends ComponentResource {
	public readonly socketPath!: Output<string>;
	public readonly configDirectory!: Output<string>;

	constructor(name: string, args: ContainerdArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:Containerd', name, args, opts);
		if (opts?.urn) return;

		const architecture = output(args.arch);
		const version = output(args.version);
		const configDirectory = output('/etc/containerd');
		const serviceName = output('containerd');
		const systemdDirectory = output(args.systemdDirectory);
		const socketPath = output('unix:///run/containerd/containerd.sock');
		const directory = output('/usr/local/bin');
		const archiveName = interpolate`containerd-${version}-linux-${architecture}.tar.gz`;
		const url = interpolate`https://github.com/containerd/containerd/releases/download/v${version}/${archiveName}`;

		const install = new ArchiveInstall(name, {
			archiveName,
			url,
			directory,
			stripComponents: 1,
			files: [
				'containerd',
				'containerd-shim',
				'containerd-shim-runc-v1',
				'containerd-shim-runc-v2',
				'containerd-stress',
				'ctr',
			],
		}, { parent: this });

		const mkdir = new Mkdir('config-mkdir', {
			args: {
				directory: [configDirectory],
			},
		}, { parent: this });

		const config = new Tee('config', {
			args: {
				files: [interpolate`${configDirectory}/config.toml`],
				stdin: output(fs.readFile('./containerd/config.toml', 'utf8')),
			},
		}, { parent: this, dependsOn: [mkdir] });

		const systemdService = new Tee('systemd-service', {
			args: {
				files: [interpolate`${systemdDirectory}/containerd.service`],
				stdin: output(fs.readFile('./containerd/containerd.service', 'utf8')),
			},
		}, { parent: this });

		// TODO
		// const start = this.cmd('start-service', {
		// 	create: interpolate`systemctl daemon-reload && systemctl enable --now ${serviceName}`,
		// 	delete: interpolate`systemctl disable --now ${serviceName}`,
		// 	triggers: [systemdService.source],
		// }, {
		// 	dependsOn: [
		// 		install,
		// 		config,
		// 		systemdService,
		// 	],
		// });

		this.configDirectory = configDirectory;
		this.socketPath = socketPath;

		this.registerOutputs({
			configDirectory,
			install,
			socketPath,
		});
	}
}
