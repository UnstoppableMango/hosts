import { Config, StackReference } from '@pulumi/pulumi';
import { PrivateKey } from '@pulumi/tls';
import { Arch, Bond, Ethernet, HostNames, Role, Versions, Vlan } from 'components';
import { z } from 'zod';

const config = new Config();

const getZod = <T>(parser: z.ZodType<T>, key: string): T | undefined => {
	return parser.optional().parse(config.getObject<T>(key));
};

const requireZod = <T>(parser: z.ZodType<T>, key: string): T => {
	return parser.parse(config.requireObject<T>(key));
};

export const arch = config.require<Arch>('arch');
export const bonds = getZod(z.record(Bond), 'bonds');
export const clusterIp = config.require('clusterIp');
export const ethernets = getZod(z.record(Ethernet), 'ethernets');
export const hostname = config.require<HostNames>('hostname');
export const installDisk = config.require('installDisk');
export const ip = config.require('ip');
export const role = config.require<Role>('role');
export const versions = requireZod(Versions, 'versions');
export const vlans = requireZod(z.record(Vlan), 'vlans');

const pkiRef = new StackReference('pki', {
	name: 'UnstoppableMango/pki/prod',
});

export const loginKey = pkiRef.requireOutput('hostKeys')
	.apply(keys => keys[hostname] as PrivateKey)
	.apply(x => x.privateKeyOpenssh);
