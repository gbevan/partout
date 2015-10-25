#!/bin/sh
#
# bootstrap.sh
#
# on Linux / Unix:
#    bash < (curl -s "https://officepc.net:10443/bootstrap?os=$(uname -s)")
# or
#    bash < (wget -q0- "https://officepc.net:10443/bootstrap?os=$(uname -s)")
#

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

echo "Getting Node.js manifest..."
curl -k -s "https://{{partout_master_hostname}}:{{partout_api_port}}/nodejsManifest?os=$(uname -s)&arch=$(uname -m)&bootstrap=1" | while read F
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


echo "Getting Partout Agent manifest..."
curl -k -s "https://{{partout_master_hostname}}:{{partout_api_port}}/agentManifest?bootstrap=1" | while read F
do
  #echo "   Syncing file: $F"

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

../node/bin/node node_modules/forever/bin/forever -c '../node/bin/node -- --singleprocess' bin/partout-agent



echo "Completed ok"
