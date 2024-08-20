import { all, ComponentResource, ComponentResourceOptions, Input, Output, output } from '@pulumi/pulumi';
import { Command } from '@unmango/baremetal';
import { Cat } from '@unmango/baremetal/coreutils';
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
		}, { parent: this });

		const cats = Object.entries(files).map(([key, file]) => {
			return new Cat(key, {
				args: { files: [file] },
			}, { parent: this, dependsOn: init });
		});

		this.registerOutputs({});
	}
}

function join(...elem: Input<string>[]): Output<string> {
	return all(elem).apply(x => path.join(...x));
}
