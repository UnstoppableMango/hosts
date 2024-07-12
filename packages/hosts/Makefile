_ := $(shell mkdir -p .make)

export ROOT        := $(shell git rev-parse --show-toplevel)
export WORKING_DIR := ${ROOT}/packages/hosts

export PULUMI := pulumi -C ${WORKING_DIR}

HOSTS := $(shell cat ${ROOT}/hosts.txt)
CONTROL_PLANES := pik8s4 pik8s5 pik8s6
WORKERS := zeus gaea vrk8s1 pik8s8 pik8s0a

COMMAND := preview

.PHONY: all preview deploy
all: preview
preview: $(HOSTS)
deploy: COMMAND := up
deploy: $(CONTROL_PLANES) $(WORKERS)

.PHONY: $(HOSTS)
$(CONTROL_PLANES): install
	@$(PULUMI) $(COMMAND) -s '$@'
$(WORKERS): install $(CONTROL_PLANES)
	@$(PULUMI) $(COMMAND) -s '$@'

stacks:
	hack/ensure-stacks.sh

.PHONY: install
install: .make/yarn_install
.make/yarn_install: yarn.lock .make/corepack_enable
	yarn install
	@touch $@

.make/corepack_enable: $(ROOT)/.nvmrc
	corepack enable
	@touch $@
