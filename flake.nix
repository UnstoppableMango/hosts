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
      imports = with inputs; [
        flake-parts.flakeModules.flakeModules
        treefmt-nix.flakeModule
        ./modules/flake/hosts.nix
      ];

      systems = import inputs.systems;

      flake.flakeModules.default = ./modules/flake/hosts.nix;
      flake.lib = import ./lib { inherit (nixpkgs) lib; };

      perSystem =
        { pkgs, ... }:
        {
          devShells.default = pkgs.mkShellNoCC {
            packages = [ pkgs.nixfmt ];
          };

          treefmt = {
            programs.nixfmt.enable = true;
          };
        };
    };
}
