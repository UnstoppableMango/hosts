import { asset, ComponentResource, ComponentResourceOptions, Input, interpolate, Output } from '@pulumi/pulumi';
import { Tee } from '@unmango/baremetal/coreutils';
import * as YAML from '../yaml';

export interface KubeVipArgs {
	clusterEndpoint: Input<string>;
	interface: Input<string>;
	kubeconfigPath: Input<string>;
	manifestDir: Input<string>;
	version: Input<string>;
}

export class KubeVip extends ComponentResource {
	constructor(name: string, args: KubeVipArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:KubeVip', name, args, opts);
		if (opts?.urn) return;

		const podManifest = new Tee('pod-manifest', {
			args: {
				files: [interpolate`${args.manifestDir}/kube-vip.yaml`],
				stdin: YAML.stringify({
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
			},
		}, { parent: this });

		this.registerOutputs({
			podManifest,
		});
	}

	public static daemonSet(): Output<string> {
		return YAML.stringify({
			apiVersion: 'apps/v1',
			kind: 'DaemonSet',
			metadata: {
				creationTimestamp: null,
				labels: {
					'app.kubernetes.io/name': 'kube-vip-ds',
					'app.kubernetes.io/version': 'v0.8.3',
				},
				name: 'kube-vip-ds',
				namespace: 'kube-system',
			},
			spec: {
				selector: {
					matchLabels: {
						'app.kubernetes.io/name': 'kube-vip-ds',
					},
				},
				template: {
					metadata: {
						creationTimestamp: null,
						labels: {
							'app.kubernetes.io/name': 'kube-vip-ds',
							'app.kubernetes.io/version': 'v0.8.3',
						},
					},
					spec: {
						affinity: {
							nodeAffinity: {
								requiredDuringSchedulingIgnoredDuringExecution: {
									nodeSelectorTerms: [{
										matchExpressions: [{
											key: 'node-role.kubernetes.io/master',
											operator: 'Exists',
										}],
									}, {
										matchExpressions: [{
											key: 'node-role.kubernetes.io/control-plane',
											operator: 'Exists',
										}],
									}],
								},
							},
						},
						containers: [{
							args: ['manager'],
							env: [
								{ name: 'vip_arp', value: 'true' },
								{ name: 'port', value: '6443' },
								{
									name: 'vip_nodename',
									valueFrom: {
										fieldRef: { fieldPath: 'spec.nodeName' },
									},
								},
								{ name: 'vip_interface', value: 'eth0' },
								{ name: 'vip_cidr', value: '32' },
								{ name: 'dns_mode', value: 'first' },
								{ name: 'cp_enable', value: 'true' },
								{ name: 'cp_namespace', value: 'kube-system' },
								{ name: 'svc_enable', value: 'true' },
								{ name: 'svc_leasename', value: 'plndr-svcs-lock' },
								{ name: 'vip_leaderelection', value: 'true' },
								{ name: 'vip_leasename', value: 'plndr-cp-lock' },
								{ name: 'vip_leaseduration', value: '5' },
								{ name: 'vip_renewdeadline', value: '3' },
								{ name: 'vip_retryperiod', value: '1' },
								{ name: 'address', value: '192.168.1.100' },
								// { name: 'prometheus_server', value: ':2112' },
							],
							image: 'ghcr.io/kube-vip/kube-vip:v0.8.3',
							imagePullPolicy: 'IfNotPresent',
							name: 'kube-vip',
							resources: {},
							securityContext: {
								capabilities: {
									add: [
										'NET_ADMIN',
										'NET_RAW',
									],
								},
							},
						}],
						hostNetwork: true,
						serviceAccountName: 'kube-vip',
						tolerations: [
							{ effect: 'NoSchedule', operator: 'Exists' },
							{ effect: 'NoExecute', operator: 'Exists' },
						],
						updateStrategy: {},
					},
				},
			},
		});
	}
}
