#!/bin/bash
set -eu

echo "Using pulumi: $PULUMI"

while read -r host; do
    if ! $PULUMI stack -s "$host" --show-name; then
        $PULUMI stack init --no-select "$host";
    fi
done <"${ROOT}/hosts.txt"
