import { type Output, output } from '@pulumi/pulumi';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import z from 'zod';

const Versions = z.object({
	cniPlugins: z.string(),
	containerd: z.string(),
	crictl: z.string(),
	k8s: z.string(),
	pulumi: z.string(),
	runc: z.string(),
});

export type Versions = z.infer<typeof Versions>;

const root = path.resolve(__dirname, '..', '..');
const versionPath = path.join(root, '.versions');
const _versions = fs.readdir(versionPath)
	.then(readFiles)
	.then(Versions.parse);

export const versions: Output<Versions> = output(_versions);

async function readFiles(files: string[]): Promise<Record<string, string>> {
	const result: Record<string, string> = {};
	for (const file in files) {
		const name = path.basename(file);
		const version = await fs.readFile(file, 'utf-8');
		result[name] = version;
	}
	return result;
}
