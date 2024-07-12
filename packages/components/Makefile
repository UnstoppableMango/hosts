_ := $(shell mkdir -p .make)

export ROOT := $(shell git rev-parse --show-toplevel)

.PHONY: build install
build: install
	yarn build

install: .make/yarn_install
.make/yarn_install: package.json yarn.lock .make/corepack_enable
	yarn install
	@touch $@

.make/corepack_enable: $(ROOT)/.nvmrc
	corepack enable
	@touch $@
