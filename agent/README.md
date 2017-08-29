Partout Agent
=============

Prerequisites
-------------

It is preferred to have Node.js pre-installed for Partout (the alternative is that Partout will see if there is
a suitable copy of Node.js available on the Master for download, during the bootstrap process).

Minimum required version of Node.js is v4.

To prep your agent's OS with Node.js:

see https://nodejs.org/en/download/package-manager/

### Debian and Ubuntu based distributions:
```bash
    curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
    sudo apt-get install -y nodejs
```

### RedHat/CentOS/Fedora Based distibutions:
```bash
    curl --silent --location https://rpm.nodesource.com/setup_5.x | bash -
    yum -y install nodejs
```

### Windows:
Install from https://nodejs.org/en  select LTS (Long Term Support) or Latest Stable version.

### Raspberry Pi (tested on Pi3)

```bash
    mkdir -p /opt/partout
    cd /opt/partout
    wget https://nodejs.org/dist/v4.4.0/node-v4.4.0-linux-armv7l.tar.xz
    tar xvf node-v4.4.0-linux-armv7l.tar.xz
    ln -s node-v4.4.0-linux-armv7l.tar.xz node
```
Add /opt/partout/node/bin to your path.

### Notes

We deliberately leave out build-essentials and development tools, as the Partout Agent must
always only depend upon Pure-JavaScript modules (ie. nothing compiled).

### Other Linux, Windows, Mac OSX, SunOS, ARM, AIX etc:

See https://nodejs.org/en/download/ for installation options.

Folder Layout
-------------

### Formal (production)

#### Linux / Unix

    /
    |-- opt/
    |   `-- partout/
    |       `-- agent/
    |           `-- bin/
    |           `-- etc/ (? moving to /var/opt, see below)
    |           `-- lib/
    |               `-- modules/
    |       `-- node/ (optionaly bootstrapped from master if not installed)
    |-- var/
    |   `-- opt/
    |       `-- partout/
    |           `-- UUID (agents unique id, given by master)
    |           `-- manifest/ (sync'd from master)
    |           `-- ssl/ (agent's csr, keys and signed cert)
    |           `-- ssl_public/ (sync'd from master)

#### Windows

TODO

### Development - Vagrant Docker

#### Linux / Unix

    /
    |-- vagrant/
    |   `-- bin/
    |   `-- etc/
    |   `-- lib/
    |       `-- modules/
    |-- var/
    |   `-- opt/
    |       `-- partout/
    |           `-- UUID (agents unique id, given by master)
    |           `-- manifest/ (sync'd from master)
    |           `-- ssl/ (agent's csr, keys and signed cert)
    |           `-- ssl_public/ (sync'd from master)

#### Windows

TODO

Execution
---------

The Partout Agent must run as root / admin (windows).

Bootstrapping
-------------

### By Downloading the agent from the API

Visting the master api with a browser will show the command to be run to bootstrap the agent to a target node.

https://master-ip:10443/

If the bootstrap finds Node.js is already installed (preferred), then it will use that, otherwise it will look for
an appropriate implementation to sync from the master to the agent, in folder:

    /
    |-- opt/
    |   `-- node/
    |       `-- ...

### By mounting a NFS or Samba Share

#### Windows

Open Node shell window as Administrator

```msdos
net use P: \\your-server\partout_agent /user:guest
P:
node bin\partout-agent --debug
```

firewall may need opening from windows nodes to permit node.js to talk to master's network.

#### Linux

Install nfs client prereq(s):

Ubuntu:
```bash
apt-get install nfs-common
```

Add the following entry to /etc/fstab

```
your-master-host:/yourpath/partout/agent  /opt/partout/agent nfs _netdev,ro,nolock,intr,bg 0 0
```

```bash
mkdir -p /opt/partout/agent
mount -a
```

Distributed Unit Testing
------------------------

Ensure unit testing prerequisites are installed on each agent node:

    bin/partout-agent apply etc/test_policies/prep.p2

Once the test endpoints have been prepped the Agent's Mocha unit-testing REST API can be enabled by setting the following in the agents' partout_agent.conf.js file:

    /*
     * Enable the /mocha REST API for real-time unit-testing during development
     * !!!THIS MUST BE DISABLED FOR PRODUCTION!!!
     */
    self.partout_agent_permit_mocha_api = true;

Next copy file ```.test_remotes.example``` to ```.test_remotes``` and edit it with the hostnames or IP addresses
of your target test endpoints.

Test by running the following command in the agent subfolder:

    gulp mocha

all being well you should get a summary report of the unit-tests something like:

```
Unit Test Summary:
==================

   Remote                      Hostname    Arch Platform         Release                             OS :     Result TimeTaken
   ------                      --------    ---- --------         -------                             -- :     ------ ---------
   *LOCAL                  officepc.net     x64    linux   4.9.34-gentoo                                :         OK
   pi3                              pi3     arm    linux      4.4.50-v7+  Raspbian GNU/Linux 8 (jessie) :         OK 277200 ms
   192.168.0.175         Grahams_laptop     x64    win32      10.0.15063             windows 10.0.15063 :         OK 105000 ms
   192.168.0.169              p-centos6     x64    linux   4.9.34-gentoo                     CentOS 6.9 :         OK 44000 ms
   192.168.0.170              p-centos7     x64    linux   4.9.34-gentoo          CentOS Linux 7 (Core) :         OK 46000 ms
   192.168.0.171               p-gentoo     x64    linux   4.9.34-gentoo                   Gentoo/Linux :         OK 43000 ms
   192.168.0.174          p-opensuse423     x64    linux   4.9.34-gentoo             openSUSE Leap 42.3 :         OK 38000 ms
   192.168.0.172              p-oracle6     x64    linux   4.9.34-gentoo        Oracle Linux Server 6.9 :         OK 46000 ms
   192.168.0.173              p-oracle7     x64    linux   4.9.34-gentoo        Oracle Linux Server 7.4 :         OK 46000 ms
   192.168.0.167             p-ubuntu14     x64    linux   4.9.34-gentoo             Ubuntu 14.04.5 LTS :         OK 49000 ms
   192.168.0.168             p-ubuntu16     x64    linux   4.9.34-gentoo             Ubuntu 16.04.3 LTS :         OK 55000 ms

----
```


You can set gulp to watch your project's agent source files for changes and to run this suite of unit-tests
every time you make a change to a file, by running:

    gulp watch-mocha

However, these tests are now getting quite exhaustive and they take a few minutes to run...

DEVELOPMENT
-----------

### LXD/LXC Agents

*NB: Guests using systemd will need to be run privileged (see below)

See script ```launch_lxd_test_containers.sh``` for launching a selection of Linux containers for testing

### NFS Agents from Git Sandbox

Prereqs (Debian/Ubuntu):
```bash
# apt-get install -y nfs-client
# curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
# apt-get install -y nodejs
```

Prereqs (RedHat/CentOS):
```bash
# curl --silent --location https://rpm.nodesource.com/setup_5.x | bash -
# yum -y install nodejs
```

/etc/exports:
```bash
/home/????/Documents/Brackets/partout/agent  172.16.0.0/16(ro)
```

On OpenStack guests:
```bash
# mkdir -p /opt/partout/agent
# mount -a
```

/etc/fstab:
```bash
??????:/home/????/Documents/Brackets/partout/agent  /opt/partout/agent nfs defaults,ro,intr 0 0
```

COPYRIGHT
---------
   ```
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2015-2017 Graham Lee Bevan <graham.bevan@ntlworld.com>

    This file is part of Partout.

    Partout is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
```
