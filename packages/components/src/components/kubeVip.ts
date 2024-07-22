import { ComponentResourceOptions, Input, interpolate } from '@pulumi/pulumi';
import * as YAML from '../yaml';
import { CommandComponent, CommandComponentArgs } from './command';

export interface KubeVipArgs extends CommandComponentArgs {
	clusterEndpoint: Input<string>;
	interface: Input<string>;
	kubeconfigPath: Input<string>;
	manifestDir: Input<string>;
	version: Input<string>;
}

export class KubeVip extends CommandComponent {
	constructor(name: string, args: KubeVipArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:KubeVip', name, args, opts);
		if (opts?.urn) return;

		const podManifest = this.tee('pod-manifest', {
			path: interpolate`${args.manifestDir}/kube-vip.yaml`,
			content: YAML.stringify({
				apiVersion: 'v1',
				kind: 'Pod',
				metadata: {
					name: 'kube-vip',
					namespace: 'kube-system',
				},
				spec: {
					containers: [{
						name: 'kube-vip',
						image: interpolate`ghcr.io/kube-vip/kube-vip:v${args.version}`,
						imagePullPolicy: 'Always',
						args: ['manager'],
						env: [
							{ name: 'address', value: args.clusterEndpoint },
							{ name: 'cp_enable', value: 'true' },
							{ name: 'cp_namespace', value: 'kube-system' },
							{ name: 'port', value: '6443' },
							{ name: 'svc_enable', value: 'true' },
							{ name: 'vip_arp', value: 'true' },
							{ name: 'vip_cidr', value: '32' },
							{ name: 'vip_interface', value: args.interface },
							{ name: 'vip_leaseduration', value: '5' },
							{ name: 'vip_leaderelection', value: 'true' },
							{ name: 'vip_renewdeadline', value: '3' },
							{ name: 'vip_retryperiod', value: '1' },
						],
						securityContext: {
							capabilities: {
								add: ['NET_ADMIN', 'NET_RAW', 'SYS_TIME'],
							},
						},
						volumeMounts: [{
							name: 'kubernetes',
							mountPath: '/etc/kubernetes/admin.conf',
						}],
					}],
					hostAliases: [{
						hostnames: ['kubernetes'],
						ip: '127.0.0.1',
					}],
					hostNetwork: true,
					volumes: [{
						name: 'kubernetes',
						hostPath: {
							path: interpolate`${args.kubeconfigPath}`,
						},
					}],
				},
			}),
		});

		this.registerOutputs({
			podManifest,
		});
	}
}
