import {
	all,
	asset,
	ComponentResource,
	ComponentResourceOptions,
	Input,
	interpolate,
	Output,
	output,
} from '@pulumi/pulumi';
import { Chmod, Tee } from '@unmango/baremetal/coreutils';
import { Architecture } from '@unmango/pulumi-kubernetes-the-hard-way/remote';
import * as YAML from 'yaml';
import { BinaryInstall } from './binaryInstall';

interface HostInfo {
	hostname: string;
	ip: string;
}

export interface PhaseArgs {
	delete?: Input<string>;
	update?: Input<string>;
	triggers?: Inputs[];
}

export interface KubeadmArgs extends CommandComponentArgs {
	arch: Architecture;
	certificatesDirectory: Input<string>;
	caCertPem: Input<string>;
	caKeyPem: Input<string>;
	clusterEndpoint: string;
	hostname: string;
	hosts: HostInfo[];
	kubernetesDirectory: Input<string>;
	version: Input<string>;
}

export class Kubeadm extends ComponentResource {
	public readonly certificatesDirectory!: Output<string>;
	public readonly configurationPath!: Output<string>;
	public readonly path!: Output<string>;

	constructor(name: string, args: KubeadmArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:Kubeadm', name, args, opts);
		if (opts?.urn) return;

		const { hostname } = args;

		const host = args.hosts.find(x => x.hostname === hostname);
		if (!host) throw new Error('Unable to match host');

		const architecture = output(args.arch);
		const binName = 'kubeadm';
		const directory = output('/usr/local/bin');
		const version = output(args.version);
		const url = interpolate`https://dl.k8s.io/release/v${version}/bin/linux/${architecture}/${binName}`;

		const certificatesDirectory = output(args.certificatesDirectory);
		const hostnames = args.hosts.map(x => x.hostname);
		const ips = args.hosts.map(x => x.ip);

		const certTee = new Tee('ca-cert', {
			args: {
				files: [interpolate`${certificatesDirectory}/ca.crt`],
				stdin: output(args.caCertPem),
			},
		}, { parent: this });

		const keyTee = new Tee('ca-key', {
			args: {
				files: [interpolate`${certificatesDirectory}/ca.crt`],
				stdin: output(args.caCertPem),
			},
		}, { parent: this });

		const configPath = interpolate`${args.kubernetesDirectory}/kubeadmcfg.yaml`;

		const config = new Tee('config', {
			args: {
				files: [configPath],
				stdin: all([
					certificatesDirectory,
					args.version,
				]).apply(([certDir, version]) =>
					[
						initConfiguration(hostname, host.ip),
						clusterConfiguration(
							host.ip,
							hostname,
							args.clusterEndpoint,
							certDir,
							hostnames,
							ips,
							version,
						),
					].join('---\n')
				),
			},
		}, { parent: this });

		const install = new BinaryInstall(name, {
			url,
			directory,
			binName,
		}, { parent: this });

		const chmod = new Chmod('bin-chmod', {
			args: {
				mode: ['+x'],
				files: [install.path],
			},
		}, { parent: this, dependsOn: install });

		this.certificatesDirectory = certificatesDirectory;
		this.configurationPath = configPath;
		this.path = install.path;

		this.registerOutputs({
			certificatesDirectory,
			configurationPath: this.configurationPath,
			install,
			chmod,
			path: this.path,
		});
	}

	public phase(phase: string, args: PhaseArgs, opts?: CustomResourceOptions): remote.Command {
		return new remote.Command(`kubeadm-${phase.replace(' ', '-')}`, {
			connection: this.connection,
			create: interpolate`kubeadm init ${phase} --config ${this.configurationPath}`,
			update: args.update,
			delete: args.delete,
			triggers: args.triggers,
		}, opts);
	}

	public initCert(cert: string, name?: Input<string>, opts?: CustomResourceOptions): remote.Command {
		return this.phase(`certs ${cert}`, {
			delete: interpolate`rm -f ${this.certificatesDirectory}/${name ?? cert}.{crt,key}`
		}, opts);
	}

	public initKubeconfig(role: string, opts?: CustomResourceOptions): remote.Command {
		return this.phase(`kubeconfig ${role}`, {}, opts);
	}

	public initControlPlane(component: string, opts?: CustomResourceOptions): remote.Command {
		return this.phase(`control-plane ${component}`, {}, opts);
	}
}

function initConfiguration(
	nodeName: string,
	ip: string,
	taints: string[] = [],
): string {
	return YAML.stringify({
		apiVersion: 'kubeadm.k8s.io/v1beta3',
		kind: 'InitConfiguration',
		nodeRegistration: {
			name: nodeName,
			taints,
		},
		localAPIEndpoint: {
			advertiseAddress: ip,
			bindPort: 6443,
		},
	});
}

function clusterConfiguration(
	ip: string,
	hostname: string,
	clusterEndpoint: string,
	certDir: string,
	names: string[],
	hosts: string[],
	version: string,
): string {
	return YAML.stringify({
		apiVersion: 'kubeadm.k8s.io/v1beta3',
		kind: 'ClusterConfiguration',
		kubernetesVersion: version,
		clusterName: 'thecluster',
		controlPlaneEndpoint: clusterEndpoint,
		networking: {
			dnsDomain: 'cluster.local',
			serviceSubnet: '10.96.0.0/12',
		},
		certificatesDir: certDir,
		etcd: {
			local: {
				serverCertSANs: [ip],
				peerCertSANs: [ip],
				extraArgs: {
					name: hostname,
					'initial-cluster': [
						`${names[0]}=https://${hosts[0]}:2380`,
						`${names[1]}=https://${hosts[1]}:2380`,
						`${names[2]}=https://${hosts[2]}:2380`,
					].join(','),
					'initial-cluster-state': 'new',
					'listen-peer-urls': `https://${ip}:2380`,
					'listen-client-urls': `https://${ip}:2379`,
					'advertise-client-urls': `https://${ip}:2379`,
					'initial-advertise-peer-urls': `https://${ip}:2380`,
				},
			},
		},
	});
}
