#!/bin/bash

WAITFORNET=30

#########
# Ubuntu
if
  lxc info p-ubuntu14 >/dev/null 2>&1
then
  :
else
  echo ">>>>>>> Launching Ubuntu14"
  lxc launch images:ubuntu/trusty/amd64 p-ubuntu14
  lxc config device add p-ubuntu14 partout disk path=/opt/partout/agent source=/home/bev/Documents/Brackets/partout/agent
  lxc config device add p-ubuntu14 passwd disk path=/opt/partout/passwd-group-obj source=/home/bev/Documents/Brackets/passwd-group-obj
  sleep $WAITFORNET
  lxc exec p-ubuntu14 bash <<EOF
  apt-get update
  apt-get install -y ca-certificates
  apt-get install -y curl
  curl -sL https://deb.nodesource.com/setup_4.x | bash -
  apt-get install -y nodejs aptitude
  npm install --global gulp-cli
EOF
fi

if
  lxc info p-ubuntu16 >/dev/null 2>&1
then
  :
else
  echo ">>>>>>> Launching Ubuntu16"
  lxc launch images:ubuntu/xenial/amd64 p-ubuntu16 --config security.privileged=1
  lxc config device add p-ubuntu16 partout disk path=/opt/partout/agent source=/home/bev/Documents/Brackets/partout/agent
  lxc config device add p-ubuntu16 passwd disk path=/opt/partout/passwd-group-obj source=/home/bev/Documents/Brackets/passwd-group-obj
  sleep $WAITFORNET
  lxc exec p-ubuntu16 bash <<EOF
  apt-get update
  apt-get install -y ca-certificates
  apt-get install -y curl
  curl -sL https://deb.nodesource.com/setup_6.x | bash -
  apt-get install -y nodejs aptitude
  npm install --global gulp-cli
EOF
fi

#########
# CentOS
if
  lxc info p-centos6 >/dev/null 2>&1
then
  :
else
  echo ">>>>>>> Launching CentOS6"
  lxc launch images:centos/6/amd64 p-centos6
  lxc config device add p-centos6 partout disk path=/opt/partout/agent source=/home/bev/Documents/Brackets/partout/agent
  lxc config device add p-centos6 passwd disk path=/opt/partout/passwd-group-obj source=/home/bev/Documents/Brackets/passwd-group-obj
  sleep $WAITFORNET
  lxc exec p-centos6 bash <<EOF
  curl --silent --location https://rpm.nodesource.com/setup_4.x | bash -
  yum -y install nodejs
  npm install --global gulp-cli
EOF
fi

if
  lxc info p-centos7 >/dev/null 2>&1
then
  :
else
  echo ">>>>>>> Launching CentOS7"
  lxc launch images:centos/7/amd64 p-centos7 --config security.privileged=1
  lxc config device add p-centos7 partout disk path=/opt/partout/agent source=/home/bev/Documents/Brackets/partout/agent
  lxc config device add p-centos7 passwd disk path=/opt/partout/passwd-group-obj source=/home/bev/Documents/Brackets/passwd-group-obj
  sleep $WAITFORNET
  lxc exec p-centos7 bash <<EOF
  curl --silent --location https://rpm.nodesource.com/setup_6.x | bash -
  yum -y install nodejs
  npm install --global gulp-cli
EOF
fi

#########
# Gentoo
if
  lxc info p-gentoo >/dev/null 2>&1
then
  :
else
  echo ">>>>>>> Launching Gentoo"
  lxc launch images:gentoo/current/amd64 p-gentoo --config security.privileged=1
  lxc config device add p-gentoo partout disk path=/opt/partout/agent source=/home/bev/Documents/Brackets/partout/agent
  lxc config device add p-gentoo passwd disk path=/opt/partout/passwd-group-obj source=/home/bev/Documents/Brackets/passwd-group-obj
  sleep $WAITFORNET
  lxc exec p-gentoo bash <<EOF
  echo "net-libs/nodejs" >> /etc/portage/package.keywords
  emerge -v nodejs --autounmask-write y
  etc-update <<EEOF
  -5
EEOF
  USE="-bindist" emerge -v openssl openssh nodejs
  npm install --global gulp-cli
EOF
fi

###############
# Oracle Linux
if
  lxc info p-oracle6 >/dev/null 2>&1
then
  :
else
  echo ">>>>>>> Launching Oracle6"
  lxc launch images:oracle/6/amd64 p-oracle6
  lxc config device add p-oracle6 partout disk path=/opt/partout/agent source=/home/bev/Documents/Brackets/partout/agent
  lxc config device add p-oracle6 passwd disk path=/opt/partout/passwd-group-obj source=/home/bev/Documents/Brackets/passwd-group-obj
  sleep $WAITFORNET
  lxc exec p-oracle6 bash <<EOF
  ifdown eth0
  ifup eth0
  sleep 10
  curl --silent --location https://rpm.nodesource.com/setup_4.x | bash -
  yum -y install nodejs
  npm install --global gulp-cli
EOF
fi

if
  lxc info p-oracle7 >/dev/null 2>&1
then
  :
else
  echo ">>>>>>> Launching oracle7"
  lxc launch images:oracle/7/amd64 p-oracle7 --config security.privileged=1
  lxc config device add p-oracle7 partout disk path=/opt/partout/agent source=/home/bev/Documents/Brackets/partout/agent
  lxc config device add p-oracle7 passwd disk path=/opt/partout/passwd-group-obj source=/home/bev/Documents/Brackets/passwd-group-obj
  sleep $WAITFORNET
  lxc exec p-oracle7 bash <<EOF
  curl --silent --location https://rpm.nodesource.com/setup_6.x | bash -
  yum -y install nodejs
  npm install --global gulp-cli
EOF
fi

##################
# OpenSuse  Linux
if
  lxc info p-opensuse132 >/dev/null 2>&1
then
  :
else
  echo ">>>>>>> Launching opensuse132"
  lxc launch images:opensuse/13.2/amd64 p-opensuse132 --config security.privileged=1
  lxc config device add p-opensuse132 partout disk path=/opt/partout/agent source=/home/bev/Documents/Brackets/partout/agent
  lxc config device add p-opensuse132 passwd disk path=/opt/partout/passwd-group-obj source=/home/bev/Documents/Brackets/passwd-group-obj
  sleep $WAITFORNET
  lxc exec p-opensuse132 bash <<EOF
  zypper ar http://download.opensuse.org/repositories/devel:/languages:/nodejs/openSUSE_13.1/ Node.js
  zypper --no-gpg-checks --non-interactive in -l -f  nodejs nodejs-devel
  npm install --global gulp-cli
EOF
fi
