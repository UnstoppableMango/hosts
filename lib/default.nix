# Derived views over ../hosts.nix, plus the validator behind the `hosts-schema`
# flake check. Pure: takes nixpkgs' `lib`, touches nothing else.
{
  lib,
  hosts ? import ../hosts.nix,
}:
let
  inherit (lib)
    attrNames
    concatMap
    concatStringsSep
    filterAttrs
    mapAttrs
    optional
    ;

  architectures = [
    "amd64"
    "arm64"
  ];

  roles = [
    "controlplane"
    "worker"
    "workstation"
  ];

  fields = [
    "arch"
    "ip"
    "role"
  ];

  # The regex rejects leading zeros, so fromJSON below is always fed a valid
  # JSON number. Nix's `&&` short-circuits and `n` is lazy, so ordering holds.
  isOctet =
    s:
    let
      n = builtins.fromJSON s;
    in
    builtins.match "(0|[1-9][0-9]{0,2})" s != null && n <= 255;

  isIpv4 =
    s:
    builtins.isString s
    && (
      let
        parts = lib.splitString "." s;
      in
      builtins.length parts == 4 && builtins.all isOctet parts
    );

  oneOf =
    name: field: allowed: value:
    optional (
      !builtins.elem value allowed
    ) "${name}: ${field} \"${toString value}\" is not one of ${concatStringsSep ", " allowed}";

  hostErrors =
    name: host:
    if !builtins.isAttrs host then
      [ "${name}: expected an attribute set, got ${builtins.typeOf host}" ]
    else
      let
        keys = attrNames host;
        missing = lib.subtractLists keys fields;
        unknown = lib.subtractLists fields keys;
      in
      optional (missing != [ ]) "${name}: missing field(s) ${concatStringsSep ", " missing}"
      ++ optional (unknown != [ ]) "${name}: unknown field(s) ${concatStringsSep ", " unknown}"
      ++ lib.optionals (host ? arch) (oneOf name "arch" architectures host.arch)
      ++ lib.optionals (host ? role) (oneOf name "role" roles host.role)
      ++ optional (
        host ? ip && !isIpv4 host.ip
      ) "${name}: ip \"${toString host.ip}\" is not a dotted-quad IPv4 address";

  # ip -> [ hostname ], so a shared address names every host holding it.
  ipOwners = lib.foldlAttrs (
    acc: name: host:
    if builtins.isAttrs host && host ? ip && builtins.isString host.ip then
      acc // { ${host.ip} = (acc.${host.ip} or [ ]) ++ [ name ]; }
    else
      acc
  ) { } hosts;

  duplicateErrors = lib.mapAttrsToList (
    ip: names: "duplicate ip ${ip} shared by ${concatStringsSep ", " names}"
  ) (filterAttrs (_: names: builtins.length names > 1) ipOwners);
in
{
  inherit hosts architectures roles;

  # Every hostname, sorted.
  names = attrNames hosts;

  # name -> ip. The shape downstream ssh config and the clan `internet`
  # service consume.
  addresses = mapAttrs (_: host: host.ip) hosts;

  byRole = role: filterAttrs (_: host: host.role == role) hosts;
  byArch = arch: filterAttrs (_: host: host.arch == arch) hosts;

  # Empty means the dataset is well-formed.
  errors = concatMap (name: hostErrors name hosts.${name}) (attrNames hosts) ++ duplicateErrors;
}
