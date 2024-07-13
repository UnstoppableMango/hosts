import { z } from 'zod';
import { Ethernets } from './netplan';

const AnyPrimitive = z.union([
	z.string(),
	z.boolean(),
	z.number(),
]);

export const Arch = z.union([
	z.literal('amd64'),
	z.literal('arm64'),
]);

export const Role = z.union([
	z.literal('controlplane'),
	z.literal('worker'),
]);

export const HostNames = z.union([
	z.literal('zeus'),
	z.literal('apollo'),
	z.literal('gaea'),
	z.literal('pik8s4'),
	z.literal('pik8s5'),
	z.literal('pik8s6'),
	z.literal('pik8s8'),
	z.literal('vrk8s1'),
	z.literal('pik8s0a'),
]);

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
	arch: Arch,
	bond: Bond.optional(),
	clusterIp: z.string(),
	ethernets: Ethernets.optional(),
	hostname: HostNames,
	installDisk: z.string(),
	ip: z.string(),
	nodeLabels: z.record(AnyPrimitive).optional(),
	nodeTaints: z.record(AnyPrimitive).optional(),
	role: Role,
	vlan: Vlan,
});

export const Versions = z.object({
	cniPlugins: z.string(),
	containerd: z.string(),
	crictl: z.string(),
	k8s: z.string(),
	runc: z.string(),
});

export type Arch = z.infer<typeof Arch>;
export type Bond = z.infer<typeof Bond>;
export type HostNames = z.infer<typeof HostNames>;
export type Node = z.infer<typeof Node>;
export type Role = z.infer<typeof Role>;
export type Versions = z.infer<typeof Versions>;
export type Vlan = z.infer<typeof Vlan>;
