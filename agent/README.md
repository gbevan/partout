Partout Agent
=============

Prerequisites
-------------

It is preferred to have Node.js pre-installed for Partout (the alternative is that Partout will see if there is
a suitable copy of Node.js available on the Master for download, during the bootstrap process).

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
net use P: \\your-server\partout_agent
P:
node bin\partout-agent --debug
```

firewall may need opening from windows nodes to permit node.js to talk to master's network.

COPYRIGHT
---------
   ```
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2015-2016  Graham Lee Bevan <graham.bevan@ntlworld.com>

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
