# Single source of truth for the machines on THECLUSTER's network.
#
# One entry per machine, keyed by hostname:
#   ip   - address to reach it on
#   arch - amd64 | arm64
#   tags - free-form labels: location, form factor, role, function
#
# Exactly one role tag (control-plane | worker | workstation) per machine.
#
# Importable directly (`import ./hosts.nix`) or via the flake's `hosts` output.
# Derived views (name -> ip, filtered by tag/arch) live in ./lib.
{
  hades = {
    ip = "192.168.1.69";
    arch = "amd64";
    tags = [
      "workstation"
      "gaming"
      "tower"
    ];
  };

  agreus = {
    ip = "10.0.69.187";
    arch = "amd64";
    tags = [
      "office"
      "k8s"
      "worker"
      "mini"
      "server"
      "rosequartz"
    ];
  };

  zeus = {
    ip = "10.0.69.10";
    arch = "amd64";
    tags = [
      "basement"
      "k8s"
      "worker"
      "tower"
      "server"
    ];
  };

  gaea = {
    ip = "10.0.69.11";
    arch = "amd64";
    tags = [
      "basement"
      "k8s"
      "worker"
      "rack"
      "server"
    ];
  };

  apollo = {
    ip = "192.168.1.12";
    arch = "amd64";
    tags = [
      "basement"
      "k8s"
      "worker"
      "rack"
      "server"
      "headless"
    ];
  };

  castor = {
    ip = "10.0.69.13";
    arch = "amd64";
    tags = [
      "basement"
      "k8s"
      "worker"
      "rack"
      "server"
      "headless"
    ];
  };

  pollux = {
    ip = "10.0.69.14";
    arch = "amd64";
    tags = [
      "basement"
      "k8s"
      "worker"
      "rack"
      "server"
      "headless"
    ];
  };

  vrk8s1 = {
    ip = "192.168.1.107";
    arch = "amd64";
    tags = [
      "living-room"
      "tower"
      "k8s"
      "worker"
      "server"
      "headless"
      "vr"
      "gaming"
      "tv"
      "media"
    ];
  };

  pik8s0a = {
    ip = "192.168.1.114";
    arch = "arm64";
    tags = [
      "pi4b"
      "k8s"
      "worker"
      "server"
      "headless"
      "portable"
    ];
  };

  pik8s1 = {
    ip = "192.168.1.101";
    arch = "arm64";
    tags = [
      "basement"
      "pi4b"
      "k8s"
      "control-plane"
      "server"
      "headless"
    ];
  };

  pik8s2 = {
    ip = "192.168.1.102";
    arch = "arm64";
    tags = [
      "basement"
      "pi4b"
      "k8s"
      "control-plane"
      "server"
      "headless"
    ];
  };

  pik8s3 = {
    ip = "192.168.1.103";
    arch = "arm64";
    tags = [
      "basement"
      "pi4b"
      "k8s"
      "control-plane"
      "server"
      "headless"
    ];
  };

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

  pik8s5 = {
    ip = "10.0.69.105";
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

  pik8s6 = {
    ip = "10.0.69.106";
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

  pik8s8 = {
    ip = "192.168.1.115";
    arch = "arm64";
    tags = [
      "basement"
      "pi4b"
      "k8s"
      "worker"
      "server"
      "headless"
    ];
  };
}
