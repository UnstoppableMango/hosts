import { remote } from '@unmango/pulumi-commandx/types/input';
import { factory } from '../../commandBuilder';

export default factory<remote.TeeOptsArgs>(
	'tee',
	(builder, opts) =>
		builder
			.option('--append', opts.append)
			.option('--ignore-interrupts', opts.ignoreInterrupts)
			.option('--output-error', opts.outputError)
			.option('--pipe', opts.pipe)
			.option('--version', opts.version)
			.arg(opts.files),
);
