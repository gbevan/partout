#!/bin/bash
#
# This will delete ALL p-* containers

lxc stop --force $(lxc list -c n | grep -v "^+" | awk '{ print $2;}' | grep -v "NAME" | grep "^p-")
lxc delete $(lxc list -c n | grep -v "^+" | awk '{ print $2;}' | grep -v "NAME" | grep "^p-")
