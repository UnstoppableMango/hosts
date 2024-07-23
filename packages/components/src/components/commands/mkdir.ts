import { remote } from '@unmango/pulumi-commandx/types/input';
import { factory } from '../../commandBuilder';

export default factory<remote.MkdirOptsArgs>(
	'mkdir',
	(builder, opts) =>
		builder
			.option('--parents', opts.parents)
			.arg(opts.directory),
);
