import { remote } from '@unmango/pulumi-commandx/types/input';
import { factory } from '../../commandBuilder';

export default factory<remote.WgetOptsArgs>(
	'wget',
	(builder, opts) =>
		builder
			.option('--directory-prefix', opts.directoryPrefix)
			.option('--https-only', opts.httpsOnly)
			.option('--no-verbose', opts.noVerbose)
			.option('--outputDocument', opts.outputDocument)
			.option('--quiet', opts.quiet)
			.option('--timestamping', opts.timestamping)
			.arg(opts.url),
);
