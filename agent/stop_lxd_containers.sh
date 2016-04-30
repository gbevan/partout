#!/bin/bash
#
# This will stop ALL p-* containers

lxc stop --force $(lxc list -c n | grep -v "^+" | awk '{ print $2;}' | grep -v "NAME" | grep "^p-")
