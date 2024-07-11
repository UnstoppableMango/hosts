
.PHONY: install
install: .make/yarn_install
.make/yarn_install: yarn.lock .make/corepack_enable
	yarn install
	@touch $@

.make/corepack_enable: $(ROOT)/.nvmrc
	corepack enable
	@touch $@
