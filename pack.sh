#!/bin/bash

set -e

PN="${BASH_SOURCE[0]##*/}"
PD="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd "${PD}"

githash="$(git rev-parse HEAD | cut -c1-6)"
gitdate="$(git log --date=short --pretty=format:"%ad" -1)"

git archive --format zip -o "fbrecord-${gitdate}-${githash}.zip" HEAD
