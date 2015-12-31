#!/bin/sh
#
# bootstrap.sh
#
# on Linux / Unix:
#    bash < (curl -s "https://officepc.net:10443/bootstrap?os=$(uname -s)")
# or
#    bash < (wget -q0- "https://officepc.net:10443/bootstrap?os=$(uname -s)")
#

#    Partout [Everywhere] - Policy-Based Configuration Management for the
#    Data-Driven-Infrastructure.
#
#    Copyright (C) 2015  Graham Lee Bevan <graham.bevan@ntlworld.com>
#
#    This file is part of Partout.
#
#    Partout is free software: you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    You should have received a copy of the GNU General Public License
#    along with this program.  If not, see <http://www.gnu.org/licenses/>.

echo -e \
"Bootstrapping:\n\n\
'########:::::'###::::'########::'########::'#######::'##::::'##:'########:\n\
 ##.... ##:::'## ##::: ##.... ##:... ##..::'##.... ##: ##:::: ##:... ##..::\n\
 ##:::: ##::'##:. ##:: ##:::: ##:::: ##:::: ##:::: ##: ##:::: ##:::: ##::::\n\
 ########::'##:::. ##: ########::::: ##:::: ##:::: ##: ##:::: ##:::: ##::::\n\
 ##.....::: #########: ##.. ##:::::: ##:::: ##:::: ##: ##:::: ##:::: ##::::\n\
 ##:::::::: ##.... ##: ##::. ##::::: ##:::: ##:::: ##: ##:::: ##:::: ##::::\n\
 ##:::::::: ##:::: ##: ##:::. ##:::: ##::::. #######::. #######::::: ##::::\n\
..:::::::::..:::::..::..:::::..:::::..::::::.......::::.......::::::..:::::\n\
                         === PARTOUT AGENT ===\n"

MYID=$(id -u)

echo "============================================="
echo "Starting Partout Agent Bootstrap Installation"
echo "============================================="
echo

if [ $MYID = "0" ]
then
  mkdir -p /opt/partout || exit 1
  cd /opt/partout || exit 1
else
  mkdir -p partout || exit 1
  cd partout || exit 1
fi

echo "Looking for existing Node.js (in PATH)"
NPATH=$(PATH=node/bin:$PATH which node)

if [ "$NPATH" == "" ]
then
  echo "No Node.js found, will look for suitable installation from Partout Master..."
  sleep 1

  echo "Getting Node.js manifest..."
  L=$(curl -k -s "https://{{partout_master_hostname}}:{{partout_api_port}}/nodejsManifest?os=$(uname -s)&arch=$(uname -m)&bootstrap=1")
  echo "$L" | while read F
  do
    nF=$(echo "$F" | sed 's?\([^/]*\)/[^/]*/[^/]*?\1?')

    D=`dirname "$nF"`
    if [ ! -d "$D" ]
    then
      mkdir -p "$D" || exit 1
    fi

    curl -k -s "https://{{partout_master_hostname}}:{{partout_api_port}}/file?file=$F" > "$nF"

    A=$(curl -k -s "https://{{partout_master_hostname}}:{{partout_api_port}}/fileAttrs?file=$F&bootstrap=1")
    A=`echo $A | sed 's/^0100//'`
    chmod $A "$nF" || exit 1
  done
  NPATH="node/bin/node"  # TODO: make absolute
fi

NVER=$($NPATH --version)
echo "Using Node.js version $NVER (at $NPATH)"
sleep 1

echo "Getting Partout Agent manifest (pls be patient)..."
L=$(curl -k -s "https://{{partout_master_hostname}}:{{partout_api_port}}/agentManifest?bootstrap=1")
echo "$L" | while read F
do
  echo $F | grep "agent/bin"

  D=`dirname "$F"`
  if [ ! -d "$D" ]
  then
    mkdir -p "$D" || exit 1
  fi

  HF=$(echo "$F" | sed -e 's/%/%25/g' -e 's/#/%23/g' -e 's/,/%2C/g' -e 's/ /%20/g')

  curl -k -s "https://{{partout_master_hostname}}:{{partout_api_port}}/file?file=$HF" > "$F"

  A=$(curl -k -s "https://{{partout_master_hostname}}:{{partout_api_port}}/fileAttrs?file=$HF&bootstrap=1")
  A=`echo $A | sed 's/^0100//'`
  chmod $A "$F" || exit 1
done

echo "Starting Partout Agent (policies will finalise the installation)"
cd agent || exit 1

# node/bin/node bin/partout-agent

echo "Executing Partout Agent first time run..."
$NPATH bin/partout-agent


echo "Completed ok"
