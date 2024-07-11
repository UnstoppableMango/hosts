import { Config } from '@pulumi/pulumi';

const config = new Config();

export const ethernets = config.requireObject('ethernets');
export const hostname = config.require('hostname');
