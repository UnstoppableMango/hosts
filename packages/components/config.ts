import { type Output, output } from '@pulumi/pulumi';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Versions } from './types';
import * as util from './util';

const root = path.resolve(__dirname, '..', '..');
const versionPath = path.join(root, '.versions');
const _versions = fs.readdir(versionPath)
	.then(util.readVersions)
	.then(Versions.parse);

export const versions: Output<Versions> = output(_versions);

export const Defaults = {
	systemdDirectory: '/usr/local/lib/systemd/system',
};
