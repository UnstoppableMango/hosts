import { ComponentResource, ComponentResourceOptions, Input, interpolate, Output, output } from '@pulumi/pulumi';
import { Command } from '@unmango/baremetal/command';
import { Mkdir, Tee } from '@unmango/baremetal/coreutils';
import { Architecture } from '@unmango/pulumi-kubernetes-the-hard-way/remote';

export interface EtcdArgs {
	arch: Architecture;
	caCertPem: Input<string>;
	caKeyPem: Input<string>;
	kubeadmcfgPath: Input<string>;
	certsDirectory: Input<string>;
	manifestDir: Input<string>;
	version: Input<string>;
}

export class Etcd extends ComponentResource {
	public readonly directory!: Output<string>;

	constructor(name: string, args: EtcdArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:Etcd', name, args, opts);
		if (opts?.urn) return;

		// const directory = output('/usr/local/bin');
		const etcdPkiPath = interpolate`${args.certsDirectory}/etcd`;
		const kubeadmcfgPath = output(args.kubeadmcfgPath);

		// const binMkdir = new Mkdir('bin-mkdir', {
		// 	args: {
		// 		directory: [directory],
		// 		parents: true,
		// 	},
		// }, { parent: this });

		const pkiMkdir = new Mkdir('pki-mkdir', {
			args: {
				directory: [etcdPkiPath],
				parents: true,
			},
		}, { parent: this });

		const certTee = new Tee('cert-tee', {
			args: {
				files: [interpolate`${etcdPkiPath}/ca.crt`],
				stdin: args.caCertPem,
			},
		}, { parent: this, dependsOn: pkiMkdir });

		const keyTee = new Tee('key-tee', {
			args: {
				files: [interpolate`${etcdPkiPath}/ca.key`],
				stdin: args.caKeyPem,
			},
		}, { parent: this, dependsOn: pkiMkdir });

		// const certs = this.initAllCerts(kubeadmcfgPath, {
		// 	dependsOn: [certTee, keyTee],
		// });

		// const removeCerts = this.cmd('clean-up-certs', {
		// 	delete: all([pkiPath, etcdPkiPath]).apply(([p, e]) =>
		// 		[
		// 			'rm -f',
		// 			`${p}/apiserver-etcd-client.crt`,
		// 			`${p}/apiserver-etcd-client.key`,
		// 			`${e}/healthcheck-client.crt`,
		// 			`${e}/healthcheck-client.key`,
		// 			`${e}/peer.crt`,
		// 			`${e}/peer.key`,
		// 			`${e}/server.crt`,
		// 			`${e}/server.key`,
		// 		].join(' ')
		// 	),
		// }, { dependsOn: certs });

		// const local = this.cmd('etcd-local', {
		// 	create: kubeadmcfgPath.apply(Etcd.initPhaseLocal),
		// 	delete: interpolate`rm -f ${manifestDir}/etcd.yaml`,
		// }, { dependsOn: certs, deleteBeforeReplace: true });

		// const varLib = this.exec(Directory, 'var-lib-etcd', {
		// 	path: '/var/lib/etcd',
		// });

		// this.directory = install.directory;

		this.registerOutputs({
			directory: this.directory,
		});
	}

	// private initAllCerts(
	// 	configPath: Input<string>,
	// 	opts?: CustomResourceOptions,
	// ): Resource[] {
	// 	return [
	// 		'etcd-server',
	// 		'etcd-peer',
	// 		'etcd-healthcheck-client',
	// 		'apiserver-etcd-client',
	// 	].map(phase => {
	// 		return this.cmd(`${phase}-certs`, {
	// 			create: output(configPath).apply(x => Etcd.initPhaseCerts(phase, x)),
	// 			delete: '',
	// 		}, opts);
	// 	});
	// }

	// private static initPhaseCerts(phase: string, config: string): string {
	// 	return `kubeadm init phase certs ${phase} --config=${config}`;
	// }

	// private static initPhaseLocal(config: string): string {
	// 	return `kubeadm init phase etcd local --config=${config}`;
	// }
}
