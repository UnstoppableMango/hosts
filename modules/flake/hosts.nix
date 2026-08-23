# The host table as a flake-parts module. Imported by this repo's flake.nix and
# exported as `flakeModules.default`, so a downstream flake-parts flake gets the
# same `flake.hosts` output, `hosts-json` package, and `hosts-schema` check.
#
# `lib` and `flake-parts-lib` come from flake-parts' specialArgs, so this module
# stands alone: it needs nothing from this flake's `inputs`.
#
# Deliberately does not set `flake.lib`. flake-parts leaves that attribute
# freeform and unique, so defining it here would collide with any consumer that
# has a `flake.lib` of their own. The derived views stay at `inputs.hosts.lib`.
{ lib, flake-parts-lib, ... }:
let
  hosts = import ../../hosts.nix;
  hostsLib = import ../../lib { inherit lib hosts; };
in
{
  # `flake.hosts` is not a stock flake-parts option, so it has to be declared.
  # Declaring any `options` forces the rest of the module under an explicit
  # `config`.
  options.flake = flake-parts-lib.mkSubmoduleOptions {
    hosts = lib.mkOption {
      type = lib.types.attrsOf (lib.types.attrsOf lib.types.str);
      description = "Host metadata, keyed by hostname. See ./hosts.nix.";
    };
  };

  config.flake.hosts = hosts;

  config.perSystem =
    { pkgs, ... }:
    {
      packages.hosts-json = (pkgs.formats.json { }).generate "hosts.json" hosts;

      checks.hosts-schema =
        pkgs.runCommand "hosts-schema"
          {
            # Surfaced in the build log when the dataset is malformed.
            errors = lib.concatStringsSep "\n" hostsLib.errors;
          }
          (
            if hostsLib.errors == [ ] then
              "touch $out"
            else
              ''
                echo "hosts.nix failed validation:" >&2
                printf '%s\n' "$errors" >&2
                exit 1
              ''
          );
    };
}
