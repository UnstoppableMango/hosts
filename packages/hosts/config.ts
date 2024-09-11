import { Config, StackReference } from '@pulumi/pulumi';
import { PrivateKey } from '@pulumi/tls';
import { Arch, Bond, CaPair, Ethernet, HostNames, Role, Versions, Vlan } from 'components';
import { z } from 'zod';

const HostInfo = z.object({
	hostname: z.string(),
	ip: z.string(),
});

export type HostInfo = z.infer<typeof HostInfo>;

const config = new Config();

const getZod = <T>(parser: z.ZodType<T>, key: string): T | undefined => {
	return parser.optional().parse(config.getObject<T>(key));
};

const requireZod = <T>(parser: z.ZodType<T>, key: string): T => {
	return parser.parse(config.requireObject<T>(key));
};

export const arch = config.require<Arch>('arch');
export const bonds = getZod(z.record(Bond), 'bonds');
export const bootstrapNode = config.require('bootstrapNode');
export const clusterEndpoint = config.require('clusterEndpoint');
export const clusterIp = config.require('clusterIp');
export const controlplanes = requireZod(z.array(HostInfo), 'controlplanes');
export const ethernets = getZod(z.record(Ethernet), 'ethernets');
export const hostname = config.require<HostNames>('hostname');
export const installDisk = config.require('installDisk');
export const ip = config.require('ip');
export const kubernetesDirectory = config.require('kubernetesDirectory');
export const role = config.require<Role>('role');
export const systemdDirectory = config.require('systemdDirectory');
export const versions = requireZod(Versions, 'versions');
export const vipInterface = config.get('vipInterface');
export const vlans = requireZod(z.record(Vlan), 'vlans');
export const workers = requireZod(z.array(HostInfo), 'workers');

export const hosts = [...controlplanes, ...workers];

const bootstrapHost = hosts.find(x => x.hostname === bootstrapNode);
export const bootstrapIp = bootstrapHost?.ip ?? clusterEndpoint;

export const provisionerAddress = ((c: Config): string => {
	return `${c.require('address')}:${c.require('port')}`;
})(new Config('baremetal'));

const pkiRef = new StackReference('pki', {
	name: 'UnstoppableMango/pki/prod',
});

export const loginKey = pkiRef.requireOutput('hostKeys')
	.apply(keys => keys[hostname] as PrivateKey)
	.apply(x => x.privateKeyOpenssh);

export const etcdCa = pkiRef.requireOutput('etcd')
	.apply(x => x as CaPair);

export const theclusterCa = pkiRef.requireOutput('thecluster')
	.apply(x => x as CaPair);

export const k3sToken = pkiRef.requireOutput('k3sToken').apply(String);
