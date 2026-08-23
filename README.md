# hosts

Host metadata for THECLUSTER's machines, as a flake.

This repo is a datasource and nothing else.
It used to provision the cluster with Pulumi; that job moved to [UnstoppableMango/nixos](https://github.com/UnstoppableMango/nixos) (clan + cairn).
What is left is the one thing no other repo owned: the table of which machines exist and how to reach them.

## Data

[`hosts.nix`](./hosts.nix) is a plain attrset, one entry per machine:

```nix
pik8s4 = {
  ip = "10.0.69.104";
  arch = "arm64";
  role = "controlplane";
};
```

| field | values |
| --- | --- |
| `ip` | dotted-quad IPv4 |
| `arch` | `amd64`, `arm64` |
| `role` | `controlplane`, `worker`, `workstation` |

Every machine is listed, including ones that are currently powered off.
There is no status field; filter downstream if you only want a subset.

| host | ip | arch | role |
| --- | --- | --- | --- |
| hades | 192.168.1.69 | amd64 | workstation |
| agreus | 10.0.69.187 | amd64 | worker |
| zeus | 192.168.1.10 | amd64 | worker |
| gaea | 192.168.1.11 | amd64 | worker |
| apollo | 192.168.1.12 | amd64 | worker |
| castor | 192.168.1.13 | amd64 | worker |
| pollux | 192.168.1.14 | amd64 | worker |
| vrk8s1 | 192.168.1.107 | amd64 | worker |
| pik8s0a | 192.168.1.114 | arm64 | worker |
| pik8s1 | 192.168.1.101 | arm64 | controlplane |
| pik8s2 | 192.168.1.102 | arm64 | controlplane |
| pik8s3 | 192.168.1.103 | arm64 | controlplane |
| pik8s4 | 10.0.69.104 | arm64 | controlplane |
| pik8s5 | 10.0.69.105 | arm64 | controlplane |
| pik8s6 | 10.0.69.106 | arm64 | controlplane |
| pik8s8 | 192.168.1.115 | arm64 | worker |

## Usage

```nix
{
  inputs.hosts.url = "github:UnstoppableMango/hosts";
}
```

| output | what it is |
| --- | --- |
| `hosts.hosts` | the raw attrset above |
| `hosts.lib.addresses` | `name -> ip` |
| `hosts.lib.names` | every hostname, sorted |
| `hosts.lib.byRole "controlplane"` | filtered attrset |
| `hosts.lib.byArch "arm64"` | filtered attrset |
| `hosts.lib.errors` | validation errors, empty when the data is well-formed |
| `hosts.packages.<system>.hosts-json` | the same data as a `hosts.json` file |
| `hosts.flakeModules.default` | a flake-parts module carrying the three outputs above |

### As a flake-parts module

```nix
{
  imports = [ inputs.hosts.flakeModules.default ];
}
```

Importing it gives your flake a `flake.hosts` output, `packages.<system>.hosts-json`, and the `hosts-schema` check.
It needs a `nixpkgs` input, like any flake-parts flake with `perSystem` outputs.

The `lib` helpers are deliberately not injected: flake-parts allows only one definition of `flake.lib`, so a module setting it would collide with yours.
Read them from `inputs.hosts.lib` instead.

`hosts.nix` also imports directly, with no flake machinery:

```nix
let hosts = import "${inputs.hosts}/hosts.nix";
```

For anything that is not Nix:

```sh
nix build github:UnstoppableMango/hosts#hosts-json && cat result
```

## Checks

`nix flake check` runs `treefmt` and `hosts-schema`.
The latter fails, naming the offending entries, when a host has missing or unknown fields, an `arch`/`role` outside the allowed set, a malformed `ip`, or an `ip` shared with another host.
