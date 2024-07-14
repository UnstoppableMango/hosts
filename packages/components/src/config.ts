import * as path from 'node:path';

const root = path.resolve(__dirname, '..', '..', '..');
// const versionPath = path.join(root, '.versions');
// const _versions = fs.readdir(versionPath)
// 	.then(x => x.map(y => path.join(versionPath, y)))
// 	.then(util.readVersions)
// 	.then(Versions.parse);

// export const versions: Output<Versions> = output(_versions);

export const Defaults = {
	systemdDirectory: '/usr/local/lib/systemd/system',
};
