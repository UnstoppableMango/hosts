# Derived views over ../hosts.nix, plus the validator behind the `hosts-schema`
# flake check. Pure: takes nixpkgs' `lib`, touches nothing else.
{
  lib,
  hosts ? import ../hosts.nix,
}:
let
  inherit (lib)
    attrNames
    attrValues
    concatMap
    concatStringsSep
    filterAttrs
    mapAttrs
    optional
    unique
    ;

  architectures = [
    "amd64"
    "arm64"
  ];

  # Every host carries exactly one of these. They are ordinary tags; the list
  # exists only so the validator can enforce that count, which is what the
  # `role` field used to guarantee.
  roleTags = [
    "control-plane"
    "worker"
    "workstation"
  ];

  fields = [
    "arch"
    "ip"
    "tags"
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

  # Lowercase alphanumeric words joined by single hyphens.
  isTag = s: builtins.isString s && builtins.match "[a-z0-9]+(-[a-z0-9]+)*" s != null;

  # Split out so a malformed `tags` produces one clear error instead of
  # cascading through the shape checks below it.
  tagErrors =
    name: tags:
    if !(builtins.isList tags && builtins.all builtins.isString tags) then
      [ "${name}: tags is not a list of strings" ]
    else
      let
        malformed = builtins.filter (t: !isTag t) tags;
        duplicated = unique (
          builtins.filter (t: builtins.length (builtins.filter (x: x == t) tags) > 1) tags
        );
        roles = builtins.filter (t: builtins.elem t roleTags) tags;
      in
      optional (malformed != [ ]) "${name}: malformed tag(s) ${concatStringsSep ", " malformed}"
      ++ optional (duplicated != [ ]) "${name}: duplicate tag(s) ${concatStringsSep ", " duplicated}"
      ++
        optional (builtins.length roles != 1)
          "${name}: expected exactly one role tag (${concatStringsSep ", " roleTags}), got ${
            if roles == [ ] then "none" else concatStringsSep ", " roles
          }";

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
      ++ lib.optionals (host ? tags) (tagErrors name host.tags)
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
  inherit hosts architectures roleTags;

  # Every hostname, sorted.
  names = attrNames hosts;

  # name -> ip. The shape downstream ssh config and the clan `internet`
  # service consume.
  addresses = mapAttrs (_: host: host.ip) hosts;

  # Every tag in use, sorted. The vocabulary is open; this is what is actually
  # applied rather than what is allowed.
  allTags = lib.sort (a: b: a < b) (unique (concatMap (host: host.tags) (attrValues hosts)));

  byTag = tag: filterAttrs (_: host: builtins.elem tag host.tags) hosts;
  byArch = arch: filterAttrs (_: host: host.arch == arch) hosts;

  # Empty means the dataset is well-formed.
  errors = concatMap (name: hostErrors name hosts.${name}) (attrNames hosts) ++ duplicateErrors;
}
