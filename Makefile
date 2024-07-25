_ := $(shell mkdir -p .make)

WORKING_DIR := $(shell git rev-parse --show-toplevel)
PROGRAM_DIR := ${WORKING_DIR}/packages/hosts
DEPLOY_MOD  := deploy

FIND_SRC := find . -type f -not -path '**/node_modules/**' -a
JSON_SRC := $(shell ${FIND_SRC} -path '*.json')
TS_SRC   := $(shell ${FIND_SRC} -path '*.ts')
GO_SRC   := $(shell find deploy -type f -path '*.go')

PULUMI := pulumi -C ${PROGRAM_DIR}
DEPLOY := bin/deploy

HOSTS := $(shell cat ${WORKING_DIR}/hosts.txt)

.PHONY: $(HOSTS) preview deploy components format
preview: components $(DEPLOY)
	$(DEPLOY) preview
deploy: components $(DEPLOY)
	$(DEPLOY) up
down: components $(DEPLOY)
	$(DEPLOY) down

$(HOSTS): components
	@$(MAKE) -C ${PROGRAM_DIR} --no-print-directory $@

components:
	@$(MAKE) -C packages/components --no-print-directory

tidy: .make/go_mod_tidy
format: .make/go_fmt .make/dprint_fmt
ocd: tidy format

hosts_array:
	@node ${WORKING_DIR}/hack/hosts_array.mjs

$(DEPLOY): $(GO_SRC)
	go build -C ${DEPLOY_MOD} -o ${WORKING_DIR}/$@

.make/go_mod_tidy: ${DEPLOY_MOD}/go.mod ${DEPLOY_MOD}/go.sum
	go -C ${DEPLOY_MOD} mod tidy
	@touch $@

.make/go_fmt: $(GO_SRC)
	go -C ${DEPLOY_MOD} fmt
	@touch $@

.make/dprint_fmt: $(TS_SRC) $(JSON_SRC)
	dprint fmt
	@touch $@
