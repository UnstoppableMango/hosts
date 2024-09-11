import { ComponentResource, ComponentResourceOptions, Input, interpolate, Output, output } from '@pulumi/pulumi';
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
	public readonly caPath!: Output<string>;
	public readonly keyPath!: Output<string>;

	constructor(name: string, args: EtcdArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:Etcd', name, args, opts);
		if (opts?.urn) return;

		const pkiPath = interpolate`${args.certsDirectory}/etcd`;
		const caPath = interpolate`${pkiPath}/ca.crt`;
		const keyPath = interpolate`${pkiPath}/ca.key`;
		const kubeadmcfgPath = output(args.kubeadmcfgPath);
		const manifestDir = output(args.manifestDir);

		const pkiMkdir = new Mkdir('pki-mkdir', {
			args: {
				directory: [pkiPath],
				parents: true,
			},
		}, { parent: this });

		const certTee = new Tee('cert-tee', {
			args: {
				files: [caPath],
				stdin: args.caCertPem,
			},
		}, { parent: this, dependsOn: pkiMkdir });

		const keyTee = new Tee('key-tee', {
			args: {
				files: [keyPath],
				stdin: args.caKeyPem,
			},
		}, { parent: this, dependsOn: pkiMkdir });

		this.caPath = caPath;
		this.keyPath = keyPath;

		this.registerOutputs({
			directory: this.directory,
			caPath: this.caPath,
			keyPath: this.keyPath,
		});
	}
}
