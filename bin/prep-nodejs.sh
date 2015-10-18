#!/bin/bash
#
# Prepare master with node releases to be cascaded to agents during installs
#
# Usage:
#   run from master top folder
#     bin/prep-nodejs.sh
#


NODE_LINUX_X64=https://nodejs.org/dist/v4.2.1/node-v4.2.1-linux-x64.tar.gz

# TODO: add other platforms

mkdir -p node/linux/x64
curl $NODE_LINUX_X64 | tar zxvf -C node/linux/x64
