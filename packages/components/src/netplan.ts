import { z } from 'zod';

// Common properties
// https://netplan.readthedocs.io/en/stable/netplan-yaml

const CommonProps = z.object({
	renderer: z.string(),
	dhcp4: z.boolean(),
	dhcp6: z.boolean(),
	addresses: z.array(z.union([
		z.string(),
		z.record(
			z.string(),
			z.object({
				lifetime: z.union([
					z.literal(0),
					z.literal('forever'),
				]),
				label: z.string(),
			}),
		),
	])),
	nameservers: z.object({
		addresses: z.array(z.string()),
		search: z.array(z.string()),
	}),
	macaddress: z.string(),
	mtu: z.string(),
	optional: z.boolean(),
	routes: z.array(z.object({
		to: z.string(),
		via: z.string(),
		metric: z.number(),
		'on-link': z.boolean(),
	})),
}).partial();

const PhysicalProps = CommonProps.extend({
	match: z.object({
		name: z.string(),
		macaddress: z.string(),
		driver: z.union([
			z.string(),
			z.array(z.string()),
		]),
	}).partial(),
	'set-name': z.string(),
	wakeonlan: z.boolean(),
}).partial();

export const Bond = z.object({
	name: z.string(),
	interfaces: z.array(z.string()),
	mode: z.union([
		z.literal('balance-rr'),
		z.literal('active-backup'),
		z.literal('balance-xor'),
		z.literal('broadcast'),
		z.literal('802.3ad'),
		z.literal('balance-tlb'),
		z.literal('balance-alb'),
	]),
});

export const Bridge = CommonProps.extend({
	interfaces: z.array(z.string()),
	parameters: z.object({
		priority: z.number().min(0).max(65535),
		'port-priority': z.record(
			z.string(),
			z.number().min(0).max(63),
		),
		'forward-delay': z.number(),
		'hello-time': z.number(),
		'max-age': z.number(),
		'path-cost': z.record(z.string(), z.number()),
		stp: z.boolean(),
	}).partial(),
}).partial();

export const DummyDevice = CommonProps;

export const Ethernet = PhysicalProps.extend({
	link: z.string(),
	'virtual-function-count': z.number(),
	'embedded-switch-mode': z.union([
		z.literal('switchdev'),
		z.literal('legaccy'),
	]),
}).partial();

export const Modem = CommonProps;

export const Tunnel = CommonProps;

export const VirtualEthernet = CommonProps;

export const Vlan = CommonProps.extend({
	id: z.number(),
	link: z.string(),
}).partial();

export const Vrfs = CommonProps;

export const Wifi = PhysicalProps.extend({
	'access-points': z.object({
		password: z.string(),
		mode: z.union([
			z.literal('infrastructure'),
			z.literal('ap'),
			z.literal('adhoc'),
		]),
		bssid: z.string(),
		band: z.union([
			z.literal('5GHz'),
			z.literal('2.4GHz'),
		]),
		channel: z.string(),
		hidden: z.boolean(),
	}).partial(),
	wakeonwlan: z.boolean(),
	'regulatory-domain': z.string(),
}).partial();

export const NmDevice = CommonProps;

export const Network = z.object({
	version: z.number().optional(),
	renderer: z.string().optional(),
	bonds: z.record(z.string(), Bond).optional(),
	bridges: z.record(z.string(), Bridge).optional(),
	'dummy-devices': z.record(z.string(), DummyDevice).optional(),
	ethernets: z.record(z.string(), Ethernet).optional(),
	modems: z.record(z.string(), Modem).optional(),
	tunnels: z.record(z.string(), Tunnel).optional(),
	'virtual-ethernets': z.record(z.string(), VirtualEthernet).optional(),
	vlans: z.record(z.string(), Vlan).optional(),
	vrfs: z.record(z.string(), Vrfs).optional(),
	wifis: z.record(z.string(), Wifi).optional(),
	'nm-devices': z.record(z.string(), NmDevice).optional(),
});

export const NetplanConfig = z.object({
	network: Network,
});

export type Bond = z.infer<typeof Bond>;
export type Ethernet = z.infer<typeof Ethernet>;
export type Vlan = z.infer<typeof Vlan>;
export type Network = z.infer<typeof Network>;
export type NetplanConfig = z.infer<typeof NetplanConfig>;
