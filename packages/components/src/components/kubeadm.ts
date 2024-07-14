import { remote } from '@pulumi/command';
import { asset, ComponentResourceOptions, Input } from '@pulumi/pulumi';
import { Chmod, Mkdir } from '@unmango/pulumi-commandx/remote';
import { Architecture, KubeadmInstall } from '@unmango/pulumi-kubernetes-the-hard-way/remote';
import { Defaults } from '../config';
import { CommandComponent, CommandComponentArgs } from './command';

export interface KubeadmArgs extends CommandComponentArgs {
	arch: Architecture;
	version: Input<string>;
}

export class Kubeadm extends CommandComponent {
	constructor(name: string, args: KubeadmArgs, opts?: ComponentResourceOptions) {
		super(`thecluster:infra:Kubeadm/${name}`, name, args, opts);
		if (opts?.urn) return;

		const install = this.exec(KubeadmInstall, name, {
			architecture: args.arch,
			version: args.version,
		});

		const chmod = this.exec(Chmod, name, {
			create: {
				mode: '+x',
				files: [install.path],
			},
		});

		const systemdDirectory = Defaults.systemdDirectory;

		const ensure = this.exec(Mkdir, name, {
			create: {
				parents: true,
				directory: `${systemdDirectory}/kubelet.service.d`,
			},
		});

		const config = this.exec(remote.CopyToRemote, name, {
			remotePath: `${systemdDirectory}/kubelet.service.d/10-kubeadm.conf`,
			source: new asset.FileAsset('./kubeadm/10-kubeadm.conf'),
		}, { dependsOn: ensure });
	}
}
