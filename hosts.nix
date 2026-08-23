# Single source of truth for the machines on THECLUSTER's network.
#
# One entry per machine, keyed by hostname:
#   ip   - address to reach it on
#   arch - amd64 | arm64
#   role - controlplane | worker | workstation
#
# Importable directly (`import ./hosts.nix`) or via the flake's `hosts` output.
# Derived views (name -> ip, filtered by role/arch) live in ./lib.
{
  hades = {
    ip = "192.168.1.69";
    arch = "amd64";
    role = "workstation";
  };

  agreus = {
    ip = "10.0.69.187";
    arch = "amd64";
    role = "worker";
  };

  zeus = {
    ip = "192.168.1.10";
    arch = "amd64";
    role = "worker";
  };

  gaea = {
    ip = "192.168.1.11";
    arch = "amd64";
    role = "worker";
  };

  apollo = {
    ip = "192.168.1.12";
    arch = "amd64";
    role = "worker";
  };

  castor = {
    ip = "192.168.1.13";
    arch = "amd64";
    role = "worker";
  };

  pollux = {
    ip = "192.168.1.14";
    arch = "amd64";
    role = "worker";
  };

  vrk8s1 = {
    ip = "192.168.1.107";
    arch = "amd64";
    role = "worker";
  };

  pik8s0a = {
    ip = "192.168.1.114";
    arch = "arm64";
    role = "worker";
  };

  pik8s1 = {
    ip = "192.168.1.101";
    arch = "arm64";
    role = "controlplane";
  };

  pik8s2 = {
    ip = "192.168.1.102";
    arch = "arm64";
    role = "controlplane";
  };

  pik8s3 = {
    ip = "192.168.1.103";
    arch = "arm64";
    role = "controlplane";
  };

  pik8s4 = {
    ip = "10.0.69.104";
    arch = "arm64";
    role = "controlplane";
  };

  pik8s5 = {
    ip = "10.0.69.105";
    arch = "arm64";
    role = "controlplane";
  };

  pik8s6 = {
    ip = "10.0.69.106";
    arch = "arm64";
    role = "controlplane";
  };

  pik8s8 = {
    ip = "192.168.1.115";
    arch = "arm64";
    role = "worker";
  };
}
