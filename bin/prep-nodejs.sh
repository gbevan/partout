#!/bin/bash
#
# Prepare master with node releases to be cascaded to agents during installs
#
# Usage:
#   run from master top folder
#     bin/prep-nodejs.sh
#


NODE_LINUX_X64=https://nodejs.org/dist/v6.10.1/node-v6.10.1-linux-x64.tar.gz

# TODO: add other platforms

mkdir -p node/linux/x64
curl $NODE_LINUX_X64 | tar zxv -C node/linux/x64 --strip-components=1
