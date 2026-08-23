.PHONY: build update check lint format fmt

build:
	nix build .#

update:
	nix flake update

check lint:
	nix flake check

format fmt:
	nix fmt
