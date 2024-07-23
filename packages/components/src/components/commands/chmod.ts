import { remote } from '@unmango/pulumi-commandx/types/input';
import { factory } from '../../commandBuilder';

export default factory<remote.ChmodOptsArgs>(
	'chmod',
	(builder, opts) =>
		builder
			.option('--changes', opts.changes)
			.option('--no-preserve-root', opts.noPreserveRoot)
			.option('--preserve-root', opts.preserveRoot)
			.option('--quiet', opts.quiet)
			.option('--silent', opts.silent)
			.option('--recursive', opts.recursive)
			.option('--refernce', opts.reference)
			.option('--help', opts.help)
			.option('--version', opts.version)
			.arg(opts.mode)
			.arg(opts.files),
);
