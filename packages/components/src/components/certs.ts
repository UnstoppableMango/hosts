import { all, ComponentResource, ComponentResourceOptions, Input, Output, output } from '@pulumi/pulumi';
import { LocallySignedCert } from '@pulumi/tls';
import { Command } from '@unmango/baremetal';
import { Cat } from '@unmango/baremetal/coreutils';
import * as path from 'node:path';
import { CaPair } from '../types';

const _25Years = 25 * 365 * 24;
const _1Week = 7 * 24;

type CaPairArgs = {
	[K in keyof CaPair]: Input<CaPair[K]>;
}

export interface CertsArgs {
	etcdCa: Input<CaPairArgs>;
	k8sDir: Input<string>;
	kubeadmcfgPath: Input<string>;
	pkiPath: Input<string>;
	theclusterCa: Input<CaPairArgs>;
}

export class Certs extends ComponentResource {
	public readonly directory!: Output<string>;

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

	constructor(name: string, args: CertsArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:Certs', name, args, opts);
		if (opts?.urn) return;

		const etcdCa = output(args.etcdCa);
		const theclusterCa = output(args.theclusterCa);
		const kubeadmcfgPath = output(args.kubeadmcfgPath);
		const pkiPath = output(args.pkiPath);
		const etcdPkiPath = join(pkiPath, 'etcd');
		const k8sDir = output(args.k8sDir);

		const files = {
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
			delete: ['rm', '-rf', ...Object.values(files)],
		}, {
			parent: this,
			replaceOnChanges: ['create', 'delete'],
			deleteBeforeReplace: true,
		});

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

		const apiServerEtcdClient = this.sign('apiServerEtcdClient', etcdCa, cats.apiServerEtcdClientCsr);
		const apiServerKubeletClient = this.sign('apiServerKubeletClient', etcdCa, cats.apiServerKubeletClientCsr);
		const apiServer = this.sign('apiServer', etcdCa, cats.apiServerCsr);
		const frontproxyClient = this.sign('frontproxyClient', etcdCa, cats.frontProxyClientCsr);
		const healthcheckClient = this.sign('healthcheckClient', etcdCa, cats.healthcheckClientCsr);
		const peer = this.sign('peer', etcdCa, cats.peerCsr);
		const server = this.sign('server', etcdCa, cats.serverCsr);
		const adminConf = this.sign('adminConf', etcdCa, cats.adminConfCsr);
		const controllerManagerConf = this.sign('controllerManagerConf', etcdCa, cats.controllerManagerConfCsr);
		const kubeletConf = this.sign('kubeletConf', etcdCa, cats.kubeletConfCsr);
		const schedulerConf = this.sign('schedulerConf', etcdCa, cats.schedulerConfCsr);
		const superAdminConf = this.sign('superAdminConf', etcdCa, cats.superAdminConfCsr);

		this.apiServerEtcdClientCsr = cats.apiServerEtcdClientCsr;
		this.apiServerEtcdClientKey = cats.apiServerEtcdClientKey;
		this.apiServerKubeletClientCsr = cats.apiServerKubeletClientCsr;
		this.apiServerKubeletClientKey = cats.apiServerKubeletClientKey;
		this.apiServerCsr = cats.apiServerCsr;
		this.apiServerKey = cats.apiServerKey;
		this.frontProxyClientCsr = cats.frontProxyClientCsr;
		this.frontProxyClientKey = cats.frontProxyClientKey;
		this.healthcheckClientCsr = cats.healthcheckClientCsr;
		this.healthcheckClientKey = cats.healthcheckClientKey;
		this.peerCsr = cats.peerCsr;
		this.peerKey = cats.peerKey;
		this.serverCsr = cats.serverCsr;
		this.serverKey = cats.serverKey;
		this.adminConf = cats.adminConf;
		this.adminConfCsr = cats.adminConfCsr;
		this.controllerManagerConf = cats.controllerManagerConf;
		this.controllerManagerConfCsr = cats.controllerManagerConfCsr;
		this.kubeletConf = cats.kubeletConf;
		this.kubeletConfCsr = cats.kubeletConfCsr;
		this.schedulerConf = cats.schedulerConf;
		this.schedulerConfCsr = cats.schedulerConfCsr;
		this.superAdminConf = cats.superAdminConf;
		this.superAdminConfCsr = cats.superAdminConfCsr;

		this.registerOutputs(cats);
	}

	sign(name: string, ca: CaPairArgs, csr: Input<string>): LocallySignedCert {
		return new LocallySignedCert(name, {
			allowedUses: [
				'cert_signing',
				'crl_signing',
				'digital_signature',
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
