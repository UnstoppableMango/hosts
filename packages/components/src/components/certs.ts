import { all, ComponentResource, ComponentResourceOptions, Input, interpolate, Output, output } from '@pulumi/pulumi';
import { LocallySignedCert } from '@pulumi/tls';
import { Command } from '@unmango/baremetal';
import { Cat, Tee } from '@unmango/baremetal/coreutils';
import * as path from 'node:path';
import { CaPair } from '../types';

const _25Years = 25 * 365 * 24;
const _1Week = 7 * 24;

type CaPairArgs = {
	[K in keyof CaPair]: Input<CaPair[K]>;
};

export interface CertsArgs {
	etcdCa: Input<CaPairArgs>;
	k8sDir: Input<string>;
	kubeadmcfgPath: Input<string>;
	pkiPath: Input<string>;
	theclusterCa: Input<CaPairArgs>;
}

interface Group {
	csr: Output<string>;
	cert: LocallySignedCert;
}

export class Certs extends ComponentResource {
	public readonly directory!: Output<string>;

	public readonly init!: Command;

	public readonly apiServerEtcdClientCsr!: Output<string>;
	public readonly apiServerEtcdClientKey!: Output<string>;
	public readonly apiServerKubeletClientCsr!: Output<string>;
	public readonly apiServerKubeletClientKey!: Output<string>;
	public readonly apiServerCsr!: Output<string>;
	public readonly apiServerKey!: Output<string>;
	public readonly frontProxyClientCsr!: Output<string>;
	public readonly frontProxyClientKey!: Output<string>;
	public readonly healthcheckClientCsr!: Output<string>;
	public readonly healthcheckClientKey!: Output<string>;
	public readonly peerCsr!: Output<string>;
	public readonly peerKey!: Output<string>;
	public readonly serverCsr!: Output<string>;
	public readonly serverKey!: Output<string>;
	public readonly adminConf!: Output<string>;
	public readonly adminConfCsr!: Output<string>;
	public readonly controllerManagerConf!: Output<string>;
	public readonly controllerManagerConfCsr!: Output<string>;
	public readonly kubeletConf!: Output<string>;
	public readonly kubeletConfCsr!: Output<string>;
	public readonly schedulerConf!: Output<string>;
	public readonly schedulerConfCsr!: Output<string>;
	public readonly superAdminConf!: Output<string>;
	public readonly superAdminConfCsr!: Output<string>;

	public readonly adminConfPath!: Output<string>;

	constructor(name: string, args: CertsArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:Certs', name, args, opts);
		if (opts?.urn) return;

		const etcdCa = output(args.etcdCa);
		const theclusterCa = output(args.theclusterCa);
		const kubeadmcfgPath = output(args.kubeadmcfgPath);
		const pkiPath = output(args.pkiPath);
		const etcdPkiPath = join(pkiPath, 'etcd');
		const k8sDir = output(args.k8sDir);

		const ca = new Tee('ca', {
			args: {
				files: [join(pkiPath, 'ca.crt')],
				stdin: theclusterCa.certPem,
			},
		}, { parent: this });

		const allFiles = {
			apiServerEtcdClientCsr: join(pkiPath, 'apiserver-etcd-client.csr'),
			apiServerEtcdClientKey: join(pkiPath, 'apiserver-etcd-client.key'),
			apiServerKubeletClientCsr: join(pkiPath, 'apiserver-kubelet-client.csr'),
			apiServerKubeletClientKey: join(pkiPath, 'apiserver-kubelet-client.key'),
			apiServerCsr: join(pkiPath, 'apiserver.csr'),
			apiServerKey: join(pkiPath, 'apiserver.key'),
			frontProxyClientCsr: join(pkiPath, 'front-proxy-client.csr'),
			frontProxyClientKey: join(pkiPath, 'front-proxy-client.key'),
			healthcheckClientCsr: join(etcdPkiPath, 'healthcheck-client.csr'),
			healthcheckClientKey: join(etcdPkiPath, 'healthcheck-client.key'),
			peerCsr: join(etcdPkiPath, 'peer.csr'),
			peerKey: join(etcdPkiPath, 'peer.key'),
			serverCsr: join(etcdPkiPath, 'server.csr'),
			serverKey: join(etcdPkiPath, 'server.key'),
			adminConf: join(k8sDir, 'admin.conf'),
			adminConfCsr: join(k8sDir, 'admin.conf.csr'),
			controllerManagerConf: join(k8sDir, 'controller-manager.conf'),
			controllerManagerConfCsr: join(k8sDir, 'controller-manager.conf.csr'),
			kubeletConf: join(k8sDir, 'kubelet.conf'),
			kubeletConfCsr: join(k8sDir, 'kubelet.conf.csr'),
			schedulerConf: join(k8sDir, 'scheduler.conf'),
			schedulerConfCsr: join(k8sDir, 'scheduler.conf.csr'),
			superAdminConf: join(k8sDir, 'super-admin.conf'),
			superAdminConfCsr: join(k8sDir, 'super-admin.conf.csr'),
		};

		const init = new Command('init-phase-certs', {
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
			delete: ['rm', '-rf', ...Object.values(allFiles)],
		}, {
			parent: this,
			replaceOnChanges: ['create', 'delete'],
			deleteBeforeReplace: true,
		});

		this.init = init;

		const files = {
			apiServerEtcdClientKey: join(pkiPath, 'apiserver-etcd-client.key'),
			apiServerKubeletClientKey: join(pkiPath, 'apiserver-kubelet-client.key'),
			apiServerKey: join(pkiPath, 'apiserver.key'),
			frontProxyClientKey: join(pkiPath, 'front-proxy-client.key'),
			healthcheckClientKey: join(etcdPkiPath, 'healthcheck-client.key'),
			peerKey: join(etcdPkiPath, 'peer.key'),
			serverKey: join(etcdPkiPath, 'server.key'),
			adminConf: join(k8sDir, 'admin.conf'),
			controllerManagerConf: join(k8sDir, 'controller-manager.conf'),
			kubeletConf: join(k8sDir, 'kubelet.conf'),
			schedulerConf: join(k8sDir, 'scheduler.conf'),
			superAdminConf: join(k8sDir, 'super-admin.conf'),
		};

		const cats = Object.entries(files)
			.map(([key, file]) =>
				[
					key,
					new Cat(key, {
						args: { files: [file] },
					}, { parent: this, dependsOn: init }),
				] as const
			)
			.reduce((p, [key, cat]) => ({ [key]: cat.stdout, ...p }), {} as typeof files);

		const apiServerEtcdClient = this.create('apiserver-etcd-client', etcdCa, pkiPath);
		const apiServerKubeletClient = this.create('apiserver-kubelet-client', theclusterCa, pkiPath);
		const apiServer = this.create('apiserver', theclusterCa, pkiPath);
		const frontProxyClient = this.create('front-proxy-client', theclusterCa, pkiPath);
		const healthcheckClient = this.create('healthcheck-client', etcdCa, etcdPkiPath);
		const peer = this.create('peer', etcdCa, etcdPkiPath);
		const server = this.create('server', etcdCa, etcdPkiPath);
		const adminConf = this.create('admin.conf', theclusterCa, k8sDir);
		const controllerManager = this.create('controller-manager.conf', theclusterCa, k8sDir);
		const kubelet = this.create('kubelet.conf', theclusterCa, k8sDir);
		const scheduler = this.create('scheduler.conf', theclusterCa, k8sDir);
		const superAdmin = this.create('super-admin.conf', theclusterCa, k8sDir);

		this.apiServerEtcdClientCsr = apiServerEtcdClient.csr;
		this.apiServerEtcdClientKey = cats.apiServerEtcdClientKey;
		this.apiServerKubeletClientCsr = apiServerKubeletClient.csr;
		this.apiServerKubeletClientKey = cats.apiServerKubeletClientKey;
		this.apiServerCsr = apiServer.csr;
		this.apiServerKey = cats.apiServerKey;
		this.frontProxyClientCsr = frontProxyClient.csr;
		this.frontProxyClientKey = cats.frontProxyClientKey;
		this.healthcheckClientCsr = healthcheckClient.csr;
		this.healthcheckClientKey = cats.healthcheckClientKey;
		this.peerCsr = peer.csr;
		this.peerKey = cats.peerKey;
		this.serverCsr = server.csr;
		this.serverKey = cats.serverKey;
		this.adminConf = cats.adminConf;
		this.adminConfCsr = adminConf.csr;
		this.controllerManagerConf = cats.controllerManagerConf;
		this.controllerManagerConfCsr = controllerManager.csr;
		this.kubeletConf = cats.kubeletConf;
		this.kubeletConfCsr = kubelet.csr;
		this.schedulerConf = cats.schedulerConf;
		this.schedulerConfCsr = scheduler.csr;
		this.superAdminConf = cats.superAdminConf;
		this.superAdminConfCsr = superAdmin.csr;

		this.adminConfPath = files.adminConf;

		this.registerOutputs(cats);
	}

	create(name: string, ca: CaPairArgs, path: Input<string>): Group {
		const csrFile = join(path, interpolate`${name}.csr`);

		const csrCat = new Cat(name, {
			args: { files: [csrFile] },
		}, { parent: this, dependsOn: this.init });

		const csr = csrCat.stdout;
		const cert = this.sign(name, ca, csr);

		const tee = new Tee(name, {
			args: {
				files: [join(path, interpolate`${name}.crt`)],
				stdin: cert.certPem,
			},
		}, { parent: this, dependsOn: cert });

		return { cert, csr };
	}

	sign(name: string, ca: CaPairArgs, csr: Input<string>): LocallySignedCert {
		return new LocallySignedCert(name, {
			allowedUses: [
				'client_auth',
				'server_auth',
				'cert_signing',
				'crl_signing',
				'digital_signature',
				'data_encipherment',
				'key_encipherment',
			],
			caCertPem: ca.certPem,
			caPrivateKeyPem: ca.privateKeyPem,
			certRequestPem: csr,
			validityPeriodHours: _25Years,
			earlyRenewalHours: _1Week,
		}, { parent: this });
	}
}

function join(...elem: Input<string>[]): Output<string> {
	return all(elem).apply(x => path.join(...x));
}
