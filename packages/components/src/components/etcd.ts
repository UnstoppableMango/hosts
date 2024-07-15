import { remote } from '@pulumi/command';
import {
	all,
	ComponentResourceOptions,
	CustomResourceOptions,
	Input,
	interpolate,
	Output,
	output,
	Resource,
} from '@pulumi/pulumi';
import { Architecture, EtcdInstall } from '@unmango/pulumi-kubernetes-the-hard-way/remote';
import { CommandComponent, CommandComponentArgs } from './command';
import { Directory } from './directory';

export interface EtcdArgs extends CommandComponentArgs {
	arch: Architecture;
	caCertPem: Input<string>;
	caKeyPem: Input<string>;
	kubeadmcfgPath: Input<string>;
	version: Input<string>;
}

export class Etcd extends CommandComponent {
	public readonly directory!: Output<string>;

	constructor(name: string, args: EtcdArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:Etcd', name, args, opts);
		if (opts?.urn) return;

		const directory = output('/usr/local/bin');
		const pkiPath = output('/etc/kubernetes/pki');
		const etcdPkiPath = interpolate`${pkiPath}/etcd`;
		const kubeadmcfgPath = output(args.kubeadmcfgPath);

		const binMkdir = this.mkdir('bin-mkdir', directory);
		const install = this.exec(EtcdInstall, name, {
			architecture: args.arch,
			directory,
			version: args.version,
		}, { dependsOn: binMkdir });

		const pkiMkdir = this.mkdir('pki-mkdir', etcdPkiPath);
		const certTee = this.tee('cert-tee', {
			path: interpolate`${etcdPkiPath}/ca.crt`,
			content: args.caCertPem,
		}, { dependsOn: pkiMkdir });

		const keyTee = this.tee('key-tee', {
			path: interpolate`${etcdPkiPath}/ca.key`,
			content: args.caKeyPem,
			secret: true,
		}, {
			dependsOn: pkiMkdir,
			additionalSecretOutputs: ['stdout'],
		});

		const certs = this.initAllCerts(kubeadmcfgPath);

		const removeCerts = this.cmd('clean-up-certs', {
			delete: all([pkiPath, etcdPkiPath]).apply(([p, e]) =>
				[
					'rm -f',
					`${p}/apiserver-etcd-client.crt`,
					`${p}/apiserver-etcd-client.key`,
					`${e}/healthcheck-client.crt`,
					`${e}/healthcheck-client.key`,
					`${e}/peer.crt`,
					`${e}/peer.key`,
					`${e}/server.crt`,
					`${e}/server.key`,
				].join(' ')
			),
		}, { dependsOn: certs });

		const local = this.cmd('etcd-local', {
			create: kubeadmcfgPath.apply(Etcd.initPhaseLocal),
		}, { dependsOn: certs });

		const varLib = this.exec(Directory, 'var-lib-etcd', {
			path: '/var/lib/etcd',
		});

		this.directory = install.directory;

		this.registerOutputs({
			directory: this.directory,
			removeCerts,
			local,
		});
	}

	public initAllCerts(config: Input<string>, opts?: CustomResourceOptions): Resource[] {
		return [
			'etcd-server',
			'etcd-peer',
			'etcd-healthcheck-client',
			'apiserver-etcd-client',
		].map(phase => {
			return this.cmd(`${phase}-certs`, {
				create: output(config).apply(x => Etcd.initPhaseCerts(phase, x)),
			}, opts);
		});
	}

	public static initPhaseCerts(phase: string, config: string): string {
		return `kubeadm init phase certs ${phase} --config=${config}`;
	}

	public static initPhaseLocal(config: string): string {
		return `kubeadm init phase etcd local --config=${config}`;
	}
}
