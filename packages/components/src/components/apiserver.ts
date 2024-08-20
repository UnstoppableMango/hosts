import { ComponentResource, ComponentResourceOptions, Input, interpolate, Output, output } from '@pulumi/pulumi';
import { CertRequest, LocallySignedCert, PrivateKey } from '@pulumi/tls';
import { Command } from '@unmango/baremetal/command';
import { Mkdir, Tee } from '@unmango/baremetal/coreutils';
import { Architecture } from '@unmango/pulumi-kubernetes-the-hard-way/remote';

export interface ApiServerArgs {
	arch: Architecture;
	caCertPem: Input<string>;
	caKeyPem: Input<string>;
	kubeadmcfgPath: Input<string>;
	pkiPath: Input<string>;
}

export class ApiServer extends ComponentResource {
	public readonly directory!: Output<string>;

	constructor(name: string, args: ApiServerArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:ApiServer', name, args, opts);
		if (opts?.urn) return;

		const kubeadmcfgPath = output(args.kubeadmcfgPath);
		const pkiPath = output(args.pkiPath);

		// const pkiMkdir = new Mkdir('pki-mkdir', {
		// 	args: {
		// 		directory: [pkiPath],
		// 		parents: true,
		// 	},
		// }, { parent: this });

		// const certTee = new Tee('cert-tee', {
		// 	args: {
		// 		files: [interpolate`${pkiPath}/ca.crt`],
		// 		stdin: args.caCertPem,
		// 	},
		// }, { parent: this, dependsOn: pkiMkdir });

		const key = new PrivateKey('apiserver', {
			algorithm: 'RSA',
			rsaBits: 4096,
		}, { parent: this });

		const keyTee = new Tee('key-tee', {
			args: {
				files: [interpolate`${pkiPath}/apiserver.key`],
				stdin: key.privateKeyPem,
			},
		}, { parent: this, dependsOn: key });

		const req = new CertRequest('apiserver', {
			privateKeyPem: key.privateKeyPem,
		}, { parent: this });

		const cert = new LocallySignedCert('apiserver', {
			allowedUses: [],
			caCertPem: args.caCertPem,
			caPrivateKeyPem: args.caKeyPem,
			certRequestPem: req.certRequestPem,
			validityPeriodHours: 2046,
		}, { parent: this });

		const certTee = new Tee('cert-tee', {
			args: {
				files: [interpolate`${pkiPath}/apiserver.crt`],
				stdin: cert.certPem,
			},
		}, { parent: this, dependsOn: cert });

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

		this.registerOutputs({});
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
