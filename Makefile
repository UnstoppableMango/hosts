_ := $(shell mkdir -p .make)

WORKING_DIR := $(shell git rev-parse --show-toplevel)
PROGRAM_DIR := ${WORKING_DIR}/packages/hosts

PULUMI := pulumi -C ${PROGRAM_DIR}

HOSTS := $(shell cat ${WORKING_DIR}/hosts.txt)

.PHONY: preview format

preview:
	@$(MAKE) -C ${PROGRAM_DIR} --no-print-directory

.PHONY: $(HOSTS)
$(HOSTS):
	@$(MAKE) -C ${PROGRAM_DIR} --no-print-directory $@

format:
	dprint fmt

hosts_array:
	@node ${WORKING_DIR}/hack/hosts_array.mjs
