import { ComponentResource, ComponentResourceOptions, Input, interpolate, output, Output } from '@pulumi/pulumi';
import { Architecture } from '@unmango/pulumi-kubernetes-the-hard-way/remote';
import { ArchiveInstall } from './archiveInstall';
import { Mkdir } from '@unmango/baremetal/coreutils';

export interface CniPluginsArgs {
	arch: Architecture;
	version: Input<string>;
}

export class CniPlugins extends ComponentResource {
	public readonly directory!: Output<string>;
	public readonly mkdir!: Mkdir;
	public readonly install!: ArchiveInstall;

	constructor(name: string, args: CniPluginsArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:CniPlugins', name, args, opts);
		if (opts?.urn) return;

		const architecture = output(args.arch);
		const directory = '/opt/cni/bin';
		const version = output(args.version ?? '1.3.0'); // TODO: Stateful versioning?
		const archiveName = interpolate`cni-plugins-linux-${architecture}-v${version}.tgz`;
		const url = interpolate`https://github.com/containernetworking/plugins/releases/download/v${version}/${archiveName}`;

		const mkdir = new Mkdir('bin-mkdir', {
			args: {
				directory: [directory],
				parents: true,
			},
		}, { parent: this });

		const install = new ArchiveInstall(name, {
			archiveName,
			url,
			directory,
			noAnchor: true,
			files: [
				'bandwidth',
				'bridge',
				'dhcp',
				'dummy',
				'firewall',
				'host-device',
				'host-local',
				'ipvlan',
				'loopback',
				'macvlan',
				'portmap',
				'ptp',
				'sbr',
				'static',
				'tap',
				'tuning',
				'vlan',
				'vrf',
			],
		});

		this.directory = install.path;
		this.mkdir = mkdir;
		this.install = install;

		this.registerOutputs({
			directory,
			mkdir,
			install,
		});
	}
}
