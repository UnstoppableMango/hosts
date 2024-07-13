import { z } from 'zod';

// Common properties
// https://netplan.readthedocs.io/en/stable/netplan-yaml/#properties-for-all-device-types

export const Bonds = z.object({
	interfaces: z.array(z.string()),
});

export const Bridges = z.object({});

export const DummyDevices = z.object({});

export const Ethernets = z.object({
	match: z.object({
		macaddress: z.string(),
	}).optional(),
	dhcp4: z.boolean().optional(),
});

export const Modems = z.object({});

export const Tunnels = z.object({});

export const VirtualEthernets = z.object({});

export const Vlans = z.object({
	id: z.number(),
	link: z.string(),
	addresses: z.array(z.string()),
	dhcp4: z.union([
		z.literal('yes'),
		z.literal('no'),
		z.boolean(),
	]),
});

export const Vrfs = z.object({});

export const Wifis = z.object({});

export const NmDevices = z.object({});

export const Network = z.object({
	version: z.number().optional(),
	renderer: z.string().optional(),
	bonds: z.record(z.string(), Bonds).optional(),
	bridges: z.record(z.string(), Bridges).optional(),
	['dummy-devices']: z.record(z.string(), DummyDevices).optional(),
	ethernets: z.record(z.string(), Ethernets).optional(),
	modems: z.record(z.string(), Modems).optional(),
	tunnels: z.record(z.string(), Tunnels).optional(),
	['virtual-ethernets']: z.record(z.string(), VirtualEthernets).optional(),
	vlans: z.record(z.string(), Vlans).optional(),
	vrfs: z.record(z.string(), Vrfs).optional(),
	wifis: z.record(z.string(), Wifis).optional(),
	['nm-devices']: z.record(z.string(), NmDevices).optional(),
});

export const NetplanConfig = z.object({
	network: Network,
});

export type Bonds = z.infer<typeof Bonds>;
export type Ethernets = z.infer<typeof Ethernets>;
export type Vlans = z.infer<typeof Vlans>;
export type Network = z.infer<typeof Network>;
export type NetplanConfig = z.infer<typeof NetplanConfig>;
