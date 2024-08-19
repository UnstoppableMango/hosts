import { all, ComponentResource, ComponentResourceOptions, Input, interpolate, Output, output } from '@pulumi/pulumi';
import { Command } from '@unmango/baremetal';
import * as path from 'node:path';

export interface CertsArgs {
	kubeadmcfgPath: Input<string>;
	pkiPath: Input<string>;
	k8sDir: Input<string>;
}

export class Certs extends ComponentResource {
	public readonly directory!: Output<string>;

	constructor(name: string, args: CertsArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:Certs', name, args, opts);
		if (opts?.urn) return;

		const kubeadmcfgPath = output(args.kubeadmcfgPath);
		const pkiPath = output(args.pkiPath);
		const k8sDir = output(args.k8sDir);

		// const key = new PrivateKey('apiserver', {
		// 	algorithm: 'RSA',
		// 	rsaBits: 4096,
		// }, { parent: this });

		// const keyTee = new Tee('key-tee', {
		// 	args: {
		// 		files: [interpolate`${pkiPath}/apiserver.key`],
		// 		stdin: key.privateKeyPem,
		// 	},
		// }, { parent: this, dependsOn: key });

		// const req = new CertRequest('apiserver', {
		// 	privateKeyPem: key.privateKeyPem,
		// }, { parent: this });

		// const cert = new LocallySignedCert('apiserver', {
		// 	allowedUses: [],
		// 	caCertPem: args.caCertPem,
		// 	caPrivateKeyPem: args.caKeyPem,
		// 	certRequestPem: req.certRequestPem,
		// 	validityPeriodHours: 2046,
		// }, { parent: this });

		// const certTee = new Tee('cert-tee', {
		// 	args: {
		// 		files: [interpolate`${pkiPath}/apiserver.crt`],
		// 		stdin: cert.certPem,
		// 	},
		// }, { parent: this, dependsOn: cert });

		const initPhase = new Command('init-phase-certs', {
			create: [
				'kubeadm',
				'certs',
				'generate-csr',
				'--config',
				kubeadmcfgPath,
				'--cert-dir',
				pkiPath,
				'--kubeconfig-dir',
				args.k8sDir,
			],
			delete: [
				'rm',
				'-rf',
				join(pkiPath, 'apiserver-etcd-client.csr'),
				join(pkiPath, 'apiserver-etcd-client.key'),
				join(pkiPath, 'apiserver-kubelet-client.csr'),
				join(pkiPath, 'apiserver-kubelet-client.key'),
				join(pkiPath, 'apiserver.csr'),
				join(pkiPath, 'apiserver.key'),
				join(pkiPath, 'front-proxy-client.csr'),
				join(pkiPath, 'front-proxy-client.key'),
				'etcd',
				join(k8sDir, 'admin.conf'),
				join(k8sDir, 'admin.conf.csr'),
				join(k8sDir, 'controller-manager.conf'),
				join(k8sDir, 'controller-manager.conf.csr'),
				join(k8sDir, 'kubelet.conf'),
				join(k8sDir, 'kubelet.conf.csr'),
				join(k8sDir, 'scheduler.conf'),
				join(k8sDir, 'scheduler.conf.csr'),
				join(k8sDir, 'super-admin.conf'),
				join(k8sDir, 'super-admin.conf.csr'),
			],
		}, { parent: this });

		this.registerOutputs({});
	}
}

function join(...elem: Input<string>[]): Output<string> {
	return all(elem).apply(x => path.join(...x));
}
