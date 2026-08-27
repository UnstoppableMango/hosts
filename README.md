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
  tags = [
    "basement"
    "pi4b"
    "k8s"
    "control-plane"
    "server"
    "headless"
    "rosequartz"
  ];
};
```

| field | values |
| --- | --- |
| `ip` | dotted-quad IPv4 |
| `arch` | `amd64`, `arm64` |
| `tags` | free-form labels, lowercase and hyphenated |

Every machine is listed, including ones that are currently powered off.
There is no status field; filter downstream if you only want a subset.

| host | ip | arch | tags |
| --- | --- | --- | --- |
| hades | 192.168.1.69 | amd64 | workstation, gaming, tower |
| agreus | 10.0.69.187 | amd64 | office, k8s, worker, mini, server, rosequartz |
| zeus | 192.168.1.10 | amd64 | basement, k8s, worker, tower, server |
| gaea | 192.168.1.11 | amd64 | basement, k8s, worker, rack, server |
| apollo | 192.168.1.12 | amd64 | basement, k8s, worker, rack, server, headless |
| castor | 192.168.1.13 | amd64 | basement, k8s, worker, rack, server, headless |
| pollux | 10.0.69.14 | amd64 | basement, k8s, worker, rack, server, headless |
| vrk8s1 | 192.168.1.107 | amd64 | living-room, tower, k8s, worker, server, headless, vr, gaming, tv, media |
| pik8s0a | 192.168.1.114 | arm64 | pi4b, k8s, worker, server, headless, portable |
| pik8s1 | 192.168.1.101 | arm64 | basement, pi4b, k8s, control-plane, server, headless |
| pik8s2 | 192.168.1.102 | arm64 | basement, pi4b, k8s, control-plane, server, headless |
| pik8s3 | 192.168.1.103 | arm64 | basement, pi4b, k8s, control-plane, server, headless |
| pik8s4 | 10.0.69.104 | arm64 | basement, pi4b, k8s, control-plane, server, headless, rosequartz |
| pik8s5 | 10.0.69.105 | arm64 | basement, pi4b, k8s, control-plane, server, headless, rosequartz |
| pik8s6 | 10.0.69.106 | arm64 | basement, pi4b, k8s, control-plane, server, headless, rosequartz |
| pik8s8 | 192.168.1.115 | arm64 | basement, pi4b, k8s, worker, server, headless |

### Tags

The vocabulary is open: any lowercase hyphenated slug is a valid tag, and adding one needs no change to the validator.
The tags in use group loosely into five kinds.

| kind | tags |
| --- | --- |
| location | `basement`, `office`, `living-room`, `portable` |
| form factor | `tower`, `rack`, `mini`, `pi4b` |
| role | `control-plane`, `worker`, `workstation` |
| function | `k8s`, `server`, `headless`, `gaming`, `media`, `tv`, `vr` |
| cluster | `rosequartz` |

Role is the one constrained group.
Every host carries exactly one of `control-plane`, `worker`, or `workstation`, which is what the former `role` field guaranteed, and the validator enforces that count.

Consumers give tags their meaning.
The nixos repo feeds them to clan as `inventory.machines.<name>.tags`, where services select machines by tag (`roles.pi4b.tags.pi4b`, `roles.server.tags.server`).

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
| `hosts.lib.allTags` | every tag in use, sorted |
| `hosts.lib.byTag "control-plane"` | filtered attrset |
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
The latter fails, naming the offending entries, when a host has missing or unknown fields, an `arch` outside the allowed set, a malformed `ip`, or an `ip` shared with another host.
For tags it fails on a value that is not a list of strings, a tag that is not a lowercase hyphenated slug, a tag repeated within one host, or a host without exactly one role tag.
