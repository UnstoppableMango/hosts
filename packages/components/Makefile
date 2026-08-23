_ := $(shell mkdir -p .make)

export ROOT := $(shell git rev-parse --show-toplevel)
SRC := $(shell find src -type f -path '*.ts')

.PHONY: build install
build: .make/yarn_build
install: .make/yarn_install

.make/yarn_build: .make/yarn_install index.ts $(SRC)
	yarn build
	@touch $@

.make/yarn_install: package.json yarn.lock
	yarn install
	@touch $@
