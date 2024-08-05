import { ComponentResource, ComponentResourceOptions } from '@pulumi/pulumi';

export interface Ipv4PacketForwardingArgs {}

export class Ipv4PacketForwarding extends ComponentResource {
	constructor(name: string, args: Ipv4PacketForwardingArgs, opts?: ComponentResourceOptions) {
		super('hosts:index:Ipv4PacketForwarding', name, args, opts);
		if (opts?.urn) return;

		// TODO
		// const deleteSysctl = this.cmd('remove-sysctl', {
		// 	delete: 'sysctl --system',
		// });

		// const file = `/etc/sysctl.d/k8s.conf`;
		// const sysctl = this.tee('sysctl-tee', {
		// 	path: file,
		// 	content: `net.ipv4.ip_forward = 1\n`,
		// }, { dependsOn: deleteSysctl });

		// this.cmd('apply-sysctl', { create: 'sysctl --system' }, { dependsOn: sysctl });

		// this.registerOutputs({
		// 	sysctl,
		// });
	}
}
