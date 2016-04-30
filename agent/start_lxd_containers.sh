#!/bin/bash
#
# This will start ALL p-* containers

lxc start $(lxc list -c n | grep -v "^+" | awk '{ print $2;}' | grep -v "NAME" | grep "^p-")
