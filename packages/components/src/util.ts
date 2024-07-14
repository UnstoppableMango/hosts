import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export async function readVersions(files: string[]): Promise<Record<string, string>> {
	const result: Record<string, string> = {};
	for (const file of files) {
		const name = path.basename(file);
		const version = await fs.readFile(file, 'utf-8');
		result[name] = version;
	}
	return result;
}
