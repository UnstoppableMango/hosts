import { Config } from '@pulumi/pulumi';
import { Bond, Ethernets, Vlan } from 'components';
import { z } from 'zod';

const config = new Config();

const requireZod = <T>(parser: z.ZodType<T>, key: string): T => {
  return parser.parse(config.requireObject(key));
}

export const arch = config.require('arch');
export const bond = requireZod(Bond, 'bond');
export const ethernets = requireZod(Ethernets, 'ethernets');
export const hostname = config.require('hostname');
export const vlan = requireZod(Vlan, 'vlan');
