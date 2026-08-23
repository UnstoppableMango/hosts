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
    flake-parts.lib.mkFlake { inherit inputs; } {
      imports = [
        # Declares the `flakeModules` option used just below.
        inputs.flake-parts.flakeModules.flakeModules
        inputs.treefmt-nix.flakeModule
        ./modules/flake/hosts.nix
      ];

      systems = import inputs.systems;

      # The module is named twice on purpose: `flakeModules` cannot be read
      # while defining `imports`.
      flake.flakeModules.default = ./modules/flake/hosts.nix;

      # Not set by the module itself; see the comment in modules/flake/hosts.nix.
      flake.lib = import ./lib { inherit (nixpkgs) lib; };

      perSystem =
        { pkgs, ... }:
        {
          devShells.default = pkgs.mkShell {
            packages = [ pkgs.nixfmt ];
          };

          treefmt = {
            programs.nixfmt.enable = true;
          };
        };
    };
}
