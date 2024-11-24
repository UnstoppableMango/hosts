import { z } from 'zod';
import { Bond, Ethernet, Vlan } from './netplan';

const AnyPrimitive = z.union([
	z.string(),
	z.boolean(),
	z.number(),
]);

export const Arch = z.union([
	z.literal('amd64'),
	z.literal('arm64'),
]);

export const CaPair = z.object({
	privateKeyPem: z.string(),
	certPem: z.string(),
});

export const Role = z.union([
	z.literal('controlplane'),
	z.literal('worker'),
]);

export const HostNames = z.union([
	z.literal('zeus'),
	z.literal('apollo'),
	z.literal('gaea'),
	z.literal('castor'),
	z.literal('pollux'),
	z.literal('pik8s4'),
	z.literal('pik8s5'),
	z.literal('pik8s6'),
	z.literal('pik8s8'),
	z.literal('vrk8s1'),
	z.literal('pik8s0a'),
]);

export const Node = z.object({
	arch: Arch,
	bond: Bond.optional(),
	clusterIp: z.string(),
	ethernets: Ethernet.optional(),
	hostname: HostNames,
	installDisk: z.string(),
	ip: z.string(),
	nodeLabels: z.record(AnyPrimitive).optional(),
	nodeTaints: z.record(AnyPrimitive).optional(),
	role: Role,
	vlan: Vlan,
});

export const Versions = z.object({
	baremetal: z.string(),
	cniPlugins: z.string(),
	containerd: z.string(),
	crictl: z.string(),
	etcd: z.string(),
	k8s: z.string(),
	krel: z.string(),
	kubeVip: z.string(),
	runc: z.string(),
	k3s: z.string(),
});

export type Arch = z.infer<typeof Arch>;
export type CaPair = z.infer<typeof CaPair>;
export type HostNames = z.infer<typeof HostNames>;
export type Node = z.infer<typeof Node>;
export type Role = z.infer<typeof Role>;
export type Versions = z.infer<typeof Versions>;
