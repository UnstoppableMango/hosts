import { remote } from '@unmango/pulumi-commandx/types/input';
import { factory } from '../../commandBuilder';

export default factory<remote.MktempOptsArgs>(
	'mktemp',
	(builder, opts) =>
		builder
			.option('--directory', opts.directory)
			.option('--dry-run', opts.dryRun)
			.option('--quiet', opts.quiet)
			.option('--suffix', opts.suffix)
			.option('--tmpdir', opts.tmpdir)
			.arg(opts.template),
);
