import { ComponentResourceOptions, Input, interpolate, output, Output } from '@pulumi/pulumi';
import { Architecture, KubeadmInstall } from '@unmango/pulumi-kubernetes-the-hard-way/remote';
import { CommandComponent, CommandComponentArgs } from './command';
import * as YAML from 'yaml';

interface HostInfo {
	hostname: string;
	ip: string;
}

export interface KubeadmArgs extends CommandComponentArgs {
	arch: Architecture;
	hostname: string;
	hosts: HostInfo[];
	kubernetesDirectory: Input<string>;
	version: Input<string>;
}

export class Kubeadm extends CommandComponent {
	public readonly configurationPath!: Output<string>;
	public readonly path!: Output<string>;

	constructor(name: string, args: KubeadmArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:Kubeadm', name, args, opts);
		if (opts?.urn) return;

		const { hostname } = args;

		const host = args.hosts.find(x => x.hostname === hostname);
		if (!host) throw new Error('Unable to match host');

		const hostnames = args.hosts.map(x => x.hostname);
		const ips = args.hosts.map(x => x.ip);

		const etcdConfig = etcd(hostname, host.ip, hostnames, ips);

		const configPath = interpolate`${args.kubernetesDirectory}/kubeadmcfg.yaml`;
		const config = this.tee('config', {
			content: output(args.version).apply(v => kubeadm(hostname, host.ip, etcdConfig, v)),
			path: configPath,
		});

		const install = this.exec(KubeadmInstall, name, {
			architecture: args.arch,
			version: args.version,
		});

		const chmod = this.chmod('bin-chmod', {
			mode: '+x',
			path: install.path,
		}, { dependsOn: install });

		this.configurationPath = configPath;
		this.path = install.path;

		this.registerOutputs({
			configurationPath: this.configurationPath,
			install,
			chmod,
			path: this.path,
		});
	}
}

function etcd(name: string, host: string, names: string[], hosts: string[]): { local: any } {
	return {
		local: {
			serverCertSANs: [host],
			peerCertSANs: [host],
			extraArgs: {
				name: name,
				'initial-cluster': [
					`${names[0]}=https://${hosts[0]}:2380`,
					`${names[1]}=https://${hosts[1]}:2380`,
					`${names[2]}=https://${hosts[2]}:2380`,
				].join(','),
				'initial-cluster-state': 'new',
				'listen-peer-urls': `https://${host}:2380`,
				'listen-client-urls': `https://${host}:2379`,
				'advertise-client-urls': `https://${host}:2379`,
				'initial-advertise-peer-urls': `https://${host}:2380`,
			},
		},
	};
}

function kubeadm(name: string, host: string, etcd: any, version: string): string {
	return [
		YAML.stringify({
			apiVersion: 'kubeadm.k8s.io/v1beta3',
			kind: 'InitConfiguration',
			nodeRegistration: {
				name: name,
				taints: [], // TODO
			},
			localAPIEndpoint: {
				advertiseAddress: host,
				bindPort: 6443,
			},
		}),
		YAML.stringify({
			apiVersion: 'kubeadm.k8s.io/v1beta3',
			kind: 'ClusterConfiguration',
			kubernetesVersion: version,
			clusterName: 'thecluster',
			networking: {
				dnsDomain: 'cluster.local',
				serviceSubnet: '10.96.0.0/12',
			},
			etcd,
		}),
	].join('---\n');
}
