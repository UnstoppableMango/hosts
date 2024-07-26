import { ComponentResourceOptions, CustomResourceOptions, Input, interpolate, Output, output, Resource } from '@pulumi/pulumi';
import { Directory } from './directory';
import { Kubeadm } from './kubeadm';
import { z } from 'zod';
import { remote } from '@pulumi/command';


const EtcdCerts = z.object({

});

export interface EtcdArgs extends CommandComponentArgs {
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
	public readonly rootPkiPath!: Output<string>;
	public readonly pkiPath!: Output<string>;

	constructor(name: string, args: EtcdArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:Etcd', name, args, opts);
		if (opts?.urn) return;

		const directory = output('/usr/local/bin');
		const etcdPkiPath = interpolate`${args.certsDirectory}/etcd`;

		const binMkdir = new Mkdir('bin-mkdir', {
			args: {
				directory: [directory],
				parents: true,
			},
		}, { parent: this });

		// TODO
		// const install = this.exec(EtcdInstall, name, {
		// 	architecture: args.arch,
		// 	directory,
		// 	version: args.version,
		// }, { dependsOn: binMkdir });

		// const pkiMkdir = this.mkdir('pki-mkdir', etcdPkiPath);
		// const certTee = this.tee('cert-tee', {
		// 	path: interpolate`${etcdPkiPath}/ca.crt`,
		// 	content: args.caCertPem,
		// }, { dependsOn: pkiMkdir });

		// const keyTee = this.tee('key-tee', {
		// 	path: interpolate`${etcdPkiPath}/ca.key`,
		// 	content: args.caKeyPem,
		// 	secret: true,
		// }, {
		// 	dependsOn: pkiMkdir,
		// 	additionalSecretOutputs: ['stdout'],
		// });

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
		this.rootPkiPath = output(args.certsDirectory);
		this.pkiPath = etcdPkiPath

		this.registerOutputs({
			directory: this.directory,
			rootPkiPath: this.rootPkiPath,
			pkiPath: this.pkiPath,
		});
	}

	public initCert(kubeadm: Kubeadm, cert: string, opts?: CustomResourceOptions): remote.Command {
		return kubeadm.initCert(`etcd-${cert}`, `etcd/${cert}`, opts);
	}

	public initLocal(kubeadm: Kubeadm, opts?: CustomResourceOptions): remote.Command {
		return kubeadm.phase('etcd local', {}, opts);
	}
}
