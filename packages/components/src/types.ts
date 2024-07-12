import { PrivateKey } from '@pulumi/tls';
import { z } from 'zod';

const AnyPrimitive = z.union([
	z.string(),
	z.boolean(),
	z.number(),
]);

export const HostKeys = z.object({
	zeus: z.instanceof(PrivateKey),
	// apollo: z.instanceof(PrivateKey),
	gaea: z.instanceof(PrivateKey),
	pik8s4: z.instanceof(PrivateKey),
	pik8s5: z.instanceof(PrivateKey),
	pik8s6: z.instanceof(PrivateKey),
	pik8s8: z.instanceof(PrivateKey),
	vrk8s1: z.instanceof(PrivateKey),
});

export const Ethernets = z.object({
	name: z.string(),
});

export const Bond = z.object({
	name: z.string(),
	interfaces: z.array(z.string()),
	addresses: z.array(z.string()),
	mode: z.string(),
});

export const Vlan = z.object({
	tag: z.number(),
	name: z.string(),
	interface: z.string(),
});

export const Node = z.object({
	hostname: HostKeys.keyof(),
	arch: z.union([
		z.literal('amd64'),
		z.literal('arm64'),
	]),
	ip: z.string(),
	clusterIp: z.string(),
	installDisk: z.string(),
	qemu: z.boolean().optional(),
	nodeLabels: z.record(AnyPrimitive).optional(),
	nodeTaints: z.record(AnyPrimitive).optional(),
	ethernets: Ethernets.optional(),
	bond: Bond.optional(),
	vlan: Vlan.optional(),
});

export const Hosts = z.object({
	zeus: Node,
	// apollo: Node,
	gaea: Node,
	pik8s4: Node,
	pik8s5: Node,
	pik8s6: Node,
	pik8s8: Node,
	vrk8s1: Node,
});

export const Versions = z.object({
	cniPlugins: z.string(),
	containerd: z.string(),
	crictl: z.string(),
	k8s: z.string(),
	pulumi: z.string(),
	runc: z.string(),
});

export type Bond = z.infer<typeof Bond>;
export type Ethernets = z.infer<typeof Ethernets>;
export type HostKeys = z.infer<typeof HostKeys>;
export type Hosts = z.infer<typeof Hosts>;
export type Node = z.infer<typeof Node>;
export type Versions = z.infer<typeof Versions>;
export type Vlan = z.infer<typeof Vlan>;
