_ := $(shell mkdir -p .make)

export ROOT        := $(shell git rev-parse --show-toplevel)
export WORKING_DIR := ${ROOT}/packages/hosts

export PULUMI := pulumi -C ${WORKING_DIR}

HOSTS := $(shell cat ${ROOT}/hosts.txt)
CONTROL_PLANES := pik8s4 pik8s5 pik8s6
WORKERS := zeus gaea vrk8s1 pik8s8

COMMAND := preview

.PHONY: all preview deploy
all: preview
preview: $(HOSTS)
deploy: COMMAND := up
deploy: $(CONTROL_PLANES) $(WORKERS)

.PHONY: $(HOSTS)
$(CONTROL_PLANES): install containerd
	@$(PULUMI) $(COMMAND) -s '$@'
$(WORKERS): install $(CONTROL_PLANES)
	@$(PULUMI) $(COMMAND) -s '$@'

KREL_VERSION := $(shell pulumi config get --path 'versions.krel')
CONTAINERD_VERSION := $(shell pulumi config get --path 'versions.containerd')
K8S_URL      := https://raw.githubusercontent.com/kubernetes/release

.PHONY: containerd
containerd: containerd/config.toml.patch containerd/containerd.service.patch

# Containerd
containerd/config.toml.patch: containerd/config_default.toml containerd/config.toml
	diff containerd/config_default.toml containerd/config.toml | tee $@

containerd/config_default.toml:
	containerd config default > $@

containerd/containerd.service.patch: containerd/containerd_default.service containerd/containerd.service
	diff containerd/containerd_default.service containerd/containerd.service | tee $@

containerd/containerd_default.service: Pulumi.yaml
	curl https://raw.githubusercontent.com/containerd/containerd/v${CONTAINERD_VERSION}/containerd.service > $@

# Kubeadm
kubeadm/10-kubeadm_default.conf: Pulumi.yaml
	curl -sSL "${K8S_URL}/v${KREL_VERSION}/cmd/krel/templates/latest/kubeadm/10-kubeadm.conf" > $@

stacks:
	hack/ensure-stacks.sh

.PHONY: install
install: .make/yarn_install
.make/yarn_install: package.json yarn.lock .make/corepack_enable
	yarn install
	@touch $@

.make/corepack_enable: $(ROOT)/.nvmrc
	corepack enable
	@touch $@
