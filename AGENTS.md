# CLAUDE.md

This file provides guidance to AI agents when working with code in this repository.

## What this repo is

A Nix flake that publishes one dataset: the table of THECLUSTER's machines (`hosts.nix`).
It is a datasource, not a provisioner.
Provisioning lives in [UnstoppableMango/nixos](https://github.com/UnstoppableMango/nixos).
Every change here is either a data edit or a change to how the data is exposed.

## Commands

```sh
command make build     # nix build .#          (produces ./result -> hosts.json)
command make check     # nix flake check       (treefmt + hosts-schema); `make lint` is the same target
command make fmt       # nix fmt               (nixfmt via treefmt-nix)
command make update    # nix flake update
```

The `command` prefix works around zsh/Prezto autoload stubs in agent subshells.
Plain `nix ...` invocations are unaffected.

There is no test suite.
`nix flake check` is the whole gate, and CI (`.github/workflows/ci.yml`) runs exactly `nix flake check` then `nix build .#`.

To run only the validator without building:

```sh
nix eval .#lib.errors --json    # [] means the dataset is well-formed
nix build .#checks.x86_64-linux.hosts-schema
```

## Architecture

Four files, each with one job:

- `hosts.nix` is a bare attrset, importable with no flake machinery (`import ./hosts.nix`).
  Keep it dependency-free so downstream consumers can read it directly.
- `lib/default.nix` is a pure function `{ lib, hosts }` returning the derived views (`names`, `addresses`, `allTags`, `byTag`, `byArch`) plus `errors`, the validator.
  It takes `hosts` as a defaulted argument so callers can validate an alternate dataset.
- `modules/flake/hosts.nix` is a flake-parts module, exported as `flake.flakeModules.default` and also imported by this flake itself.
  It defines the `flake.hosts` option, the `hosts-json` package, and the `hosts-schema` check that fails the build when `lib.errors` is non-empty.
- `flake.nix` wires those together and sets `flake.lib = import ./lib`.

The module deliberately does not set `flake.lib`.
flake-parts permits only one definition of it, so a consuming flake would collide.
Consumers read helpers from `inputs.hosts.lib` instead.

## Editing the data

Adding or changing a host touches more than `hosts.nix`:

1. Edit `hosts.nix`.
   Powered-off machines stay listed; there is no status field.
   Every host needs exactly one role tag (`control-plane`, `worker`, `workstation`).
2. Update the host table in `README.md`, and the tag table if the tag is a new one.
   Nothing generates them, so they drift silently.
3. Run `command make check`.

Tag order within a host is significant.
The nixos repo feeds `tags` straight to clan as `inventory.machines.<name>.tags`, which preserves the order, so reordering a list shows up as an inventory diff downstream.

Adding a new **field** or allowed value touches more still:

- `lib/default.nix`: the `fields`, `architectures`, or `roleTags` list, and `hostErrors` if the field needs a shape check beyond membership.
- `modules/flake/hosts.nix`: the `flake.hosts` option type is a submodule declaring `ip`, `arch`, and `tags`, so an undeclared field or a wrong type fails there even when `lib.errors` is empty.
- `README.md`: the field table, the tag table, and the usage table.

The validator and the option type are two independent checks over the same data.
Keep them in agreement.
