import { remote } from '@pulumi/command';
import { asset, ComponentResourceOptions, Input, interpolate, Output, output } from '@pulumi/pulumi';
import { Architecture, ContainerdInstall } from '@unmango/pulumi-kubernetes-the-hard-way/remote';
import { CommandComponent, CommandComponentArgs } from './command';

export interface ContainerdArgs extends CommandComponentArgs {
	arch: Architecture;
	systemdDirectory: Input<string>;
	version: Input<string>;
}

export class Containerd extends CommandComponent {
	public readonly socketPath!: Output<string>;
	public readonly configDirectory!: Output<string>;

	constructor(name: string, args: ContainerdArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:Containerd', name, args, opts);
		if (opts?.urn) return;

		const configDirectory = output('/etc/containerd');
		const serviceName = output('containerd');
		const socketPath = output('unix:///run/containerd/containerd.sock');
		const systemdDirectory = output(args.systemdDirectory);
		const version = output(args.version);

		const install = this.exec(ContainerdInstall, name, {
			architecture: args.arch,
			version,
		});

		const mkdir = this.mkdir('config-mkdir', configDirectory);
		const config = this.exec(remote.CopyToRemote, 'config', {
			remotePath: interpolate`${configDirectory}/config.toml`,
			source: new asset.FileAsset('./containerd/config.toml'),
		}, { dependsOn: mkdir });

		const systemdService = this.exec(remote.CopyToRemote, 'systemd-service', {
			remotePath: interpolate`${systemdDirectory}/containerd.service`,
			source: new asset.FileAsset('./containerd/containerd.service'),
		});

		const start = this.cmd('start-service', {
			create: interpolate`systemctl daemon-reload && systemctl enable --now ${serviceName}`,
			delete: interpolate`systemctl disable --now ${serviceName}`,
			triggers: [systemdService.source],
		}, {
			dependsOn: [
				install,
				config,
				systemdService,
			],
		});

		this.configDirectory = configDirectory;
		this.socketPath = socketPath;

		this.registerOutputs({
			configDirectory,
			install,
			socketPath,
		});
	}
}
