import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const hostsFile = join(root, 'hosts.txt');
const hosts = readFileSync(hostsFile, 'utf8')
	.trim()
	.split('\n');

console.log(JSON.stringify(hosts));
