import { ComponentResource, ComponentResourceOptions, Input, interpolate, Output, output } from '@pulumi/pulumi';
import { Mkdir, Tee } from '@unmango/baremetal/coreutils';
import { Architecture } from '@unmango/pulumi-kubernetes-the-hard-way/remote';
import { YAML } from 'components';
import { ArchiveInstall } from './archiveInstall';

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
		const url =
			interpolate`https://github.com/containernetworking/plugins/releases/download/v${version}/${archiveName}`;

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
		}, { parent: this });

		const bridge = new Tee('bridge', {
			args: {
				files: [`/etc/cni/net.d/10-bridge.conf`],
				stdin: JSON.stringify({
					cniVersion: '1.0.0',
					name: 'bridge',
					type: 'bridge',
					bridge: 'cni0',
					ipMasq: true,
					isGateway: true,
					ipam: {
						type: 'host-local',
						ranges: [{
							subnet: '10.0.69.0/16',
						}],
						routes: [{
							dst: '0.0.0.0/0',
						}],
					},
				}),
			},
		}, { parent: this });

		const loopback = new Tee('loopback', {
			args: {
				files: [`/etc/cni/net.d/99-loopback.conf`],
				stdin: JSON.stringify({
					cniVersion: '1.1.0',
					name: 'lo',
					type: 'loopback',
				}),
			},
		}, { parent: this });

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
