_ := $(shell mkdir -p .make)

export ROOT        := $(shell git rev-parse --show-toplevel)
export WORKING_DIR := ${ROOT}/packages/hosts

export PULUMI := pulumi -C ${WORKING_DIR}

HOSTS := $(shell cat ${WORKING_DIR}/hosts.txt)

.PHONY: all
all: $(HOSTS)

.PHONY: $(HOSTS)
$(HOSTS): install
	@$(PULUMI) preview -s '$@'

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
