{ lib, flake-parts-lib, ... }:
let
  hosts = import ../../hosts.nix;
  hostsLib = import ../../lib { inherit lib hosts; };
in
{
  options.flake = flake-parts-lib.mkSubmoduleOptions {
    hosts = lib.mkOption {
      type = lib.types.attrsOf (lib.types.attrsOf lib.types.str);
      description = "Host metadata, keyed by hostname. See ./hosts.nix.";
    };
  };

  config.flake.hosts = hosts;

  config.perSystem =
    { pkgs, ... }:
    let
      json = pkgs.formats.json { };
    in
    {
      packages.hosts-json = json.generate "hosts.json" hosts;

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
