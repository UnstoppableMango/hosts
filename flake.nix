{
  description = "Host metadata for THECLUSTER's machines";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    systems.url = "github:nix-systems/default";
    flake-parts.url = "github:hercules-ci/flake-parts";

    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    inputs@{ flake-parts, nixpkgs, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } (
      let
        hosts = import ./hosts.nix;
        hostsLib = import ./lib {
          inherit hosts;
          inherit (nixpkgs) lib;
        };
      in
      {
        imports = [ inputs.treefmt-nix.flakeModule ];

        # `flake.lib` is a stock flake-parts option; `flake.hosts` is not, so it
        # has to be declared. Declaring any `options` forces the rest of the
        # module under an explicit `config`.
        options.flake = flake-parts.lib.mkSubmoduleOptions {
          hosts = nixpkgs.lib.mkOption {
            type = nixpkgs.lib.types.attrsOf (nixpkgs.lib.types.attrsOf nixpkgs.lib.types.str);
            description = "Host metadata, keyed by hostname. See ./hosts.nix.";
          };
        };

        config.systems = import inputs.systems;

        config.flake = {
          inherit hosts;
          lib = hostsLib;
        };

        config.perSystem =
          { pkgs, ... }:
          {
            packages.hosts-json = (pkgs.formats.json { }).generate "hosts.json" hosts;

            checks.hosts-schema =
              pkgs.runCommand "hosts-schema"
                {
                  # Surfaced in the build log when the dataset is malformed.
                  errors = nixpkgs.lib.concatStringsSep "\n" hostsLib.errors;
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

            devShells.default = pkgs.mkShell {
              packages = [ pkgs.nixfmt ];
            };

            treefmt = {
              programs.nixfmt.enable = true;
            };
          };
      }
    );
}
