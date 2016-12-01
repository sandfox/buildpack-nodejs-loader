#!/usr/bin/env bash

# Actually just finds the node binary
# we expect to spawned from node_modules/buildpack_nodejs_loader
APP_ROOT="$(cd "$(dirname "${0:-}")"; cd ../..; pwd)"

profiles=(${APP_ROOT}/.profile.d/*)

# buildpack's expect home to be the app root
HOME="${APP_ROOT}"

for profile in "${profiles[@]}"; do
  source "${profile}"
done
