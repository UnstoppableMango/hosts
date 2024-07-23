import { all, ComponentResourceOptions, Input, interpolate, Output, output } from '@pulumi/pulumi';
import { Architecture } from '@unmango/pulumi-kubernetes-the-hard-way/remote';
import * as systemd from '../systemd';
import * as YAML from '../yaml';
import { BinaryInstall } from './binaryInstall';
import { CommandComponent, CommandComponentArgs } from './command';
import { Directory } from './directory';

export interface KubeletArgs extends CommandComponentArgs {
	arch: Architecture;
	bootstrapKubeconfig: Input<string>;
	containerdSocket: Input<string>;
	kubeconfig: Input<string>;
	kubernetesDirectory: Input<string>;
	systemdDirectory: Input<string>;
	version: Input<string>;
}

export class Kubelet extends CommandComponent {
	public readonly manifestDir!: Output<string>;

	constructor(name: string, args: KubeletArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:Kubelet', name, args, opts);
		if (opts?.urn) return;

		const bootstrapKubeconfig = output(args.bootstrapKubeconfig);
		const kubeconfig = output(args.kubeconfig);
		const k8sDir = output(args.kubernetesDirectory);
		const serviceName = output('kubelet');
		const systemdDirectory = output(args.systemdDirectory);

		const arch = output(args.arch ?? 'amd64');
		const binName = 'kubelet';
		const version = output(args.version);
		const url = interpolate`https://dl.k8s.io/release/v${version}/bin/linux/${arch}/${binName}`;
		const install = this.exec(BinaryInstall, name, { binName, url });

		// const configDir = interpolate`${k8sDir}/kubelet.conf.d`;
		// const configMkdir = this.mkdir('config-mkdir', configDir);

		const manifestDir = interpolate`${k8sDir}/manifests`;
		const manifestsMkdir = this.mkdir('manifests', manifestDir);

		const configDir = this.exec(Directory, 'var-lib', {
			path: '/var/lib/kubelet',
		});

		// I think kubeadm puts the kubeconfig here
		// const configPath = interpolate`${k8sDir}/kubelet.conf`;
		const configPath = interpolate`${configDir.path}/kubelet.conf`;
		const config = this.tee('config-tee', {
			path: configPath,
			content: YAML.stringify({
				apiVersion: 'kubelet.config.k8s.io/v1beta1',
				kind: 'KubeletConfiguration',
				address: '127.0.0.1',
				cgroupDriver: 'systemd',
				containerRuntimeEndpoint: args.containerdSocket,
				staticPodPath: manifestDir,
				authentication: {
					anonymous: {
						enabled: false,
					},
					webhook: {
						enabled: false,
					},
				},
				authorization: {
					mode: 'AlwaysAllow',
				},
			}),
		});

		const systemdService = this.tee('systemd-service', {
			path: interpolate`${systemdDirectory}/${serviceName}.service`,
			content: systemd.stringify({
				unit: {
					description: 'kubelet: The Kubernetes Node Agent',
					documentation: ['https://kubernetes.io/docs/'],
					wants: ['network-online.target'],
					after: ['network-online.target'],
				},
				service: {
					environmentFile: [
						// This is a file that "kubeadm init" and "kubeadm join" generates at runtime, populating the KUBELET_KUBEADM_ARGS variable dynamically
						interpolate`-/var/lib/kubelet/kubeadm-flags.env`,
					],
					execStart: all([
						install.path,
						interpolate`--config=${configPath}`,
						interpolate`$KUBELET_KUBEADM_ARGS`,
					]).apply(x => x.join(' ')),
					restart: 'always',
					restartSec: '10',
					startLimitInterval: '0',
				},
				install: {
					wantedBy: ['multi-user.target'],
				},
			}),
		});

		const start = this.cmd('start', {
			create: interpolate`systemctl daemon-reload && systemctl enable ${serviceName}`,
			delete: interpolate`systemctl disable --now ${serviceName}`,
			triggers: [systemdService.stdin],
		}, {
			dependsOn: [
				install,
				config,
				configDir,
				manifestsMkdir,
				systemdService,
			],
		});

		this.manifestDir = manifestDir;

		this.registerOutputs({
			install,
			configDir,
			manifestDir,
			manifestsMkdir,
			config,
			systemdService,
			start,
		});
	}
}
