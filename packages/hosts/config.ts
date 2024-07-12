import { Config } from '@pulumi/pulumi';
import { Arch, Bond, Ethernets, Hosts, Versions, Vlan } from 'components';
import { z } from 'zod';

const config = new Config();

const getZod = <T>(parser: z.ZodType<T>, key: string): T | undefined => {
	return parser.optional().parse(config.getObject<T>(key));
}

const requireZod = <T>(parser: z.ZodType<T>, key: string): T => {
  return parser.parse(config.requireObject<T>(key));
}

export const arch = config.require<Arch>('arch');
export const bond = getZod(Bond, 'bond');
export const clusterIp = config.require('clusterIp');
export const ethernets = getZod(Ethernets, 'ethernets');
export const hostname = config.require<keyof Hosts>('hostname');
export const installDisk = config.require('installDisk');
export const ip = config.require('ip');
export const versions = requireZod(Versions, 'versions');
export const vlan = requireZod(Vlan, 'vlan');
