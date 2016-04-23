Partout
=======

The goal is to develop a pure Javascript/Node.js DevOps Data and Event Driven Policy Based Configuration Management tool for the Internet of Everything.

"Partout" is french for "Everywhere"

\* THIS PROJECT IS UNDER INITIAL DEVELOPMENT AND IS NOT READY FOR \_ANY\_ FORM OF PRODUCTION USE *

Licensed under the GNU General Public License Version 3 (GPLv3 - see [COPYING](./COPYING)).

If you wish (and indeed you are invited) to contribute to this Open Source project, please understand that:

    By contributing [patches, pull requests, documentation, etc] to this project you are clearly indicating
    your assent for inclusion of your contributions to this project under this project's (GPLv3) license and
    agree that your contributions do not infringe on any existing copyrighted or patented products to your
    knowledge.

Features
--------

* Integration with operating system provided real-time notification of file system object changes (e.g. linux inotify) to trigger re-scan against policy - real-time repair...
* Policy files compile to native machine code at runtime (expressed as a DSL in Javascript under Node.js).

Platforms
---------

Platforms currently being developed and tested on are:

* Gentoo linux
* Ubuntu Linux
* CentOS Linux
* Microsoft Windows 10
* Raspberry Pi3 (Raspbian 8 jessie)

(see Agent and Unit-Testing Policies below...)

Prerequisites
-------------
* Node.js v4 or above
* ArangoDB (master only)

Agent and Unit-Testing Policies
-------------------------------

* See [Agent Readme](./agent/README.md)

Modules
-------

* [Command](./agent/lib/modules/command/README.md)
* [Exec](./agent/lib/modules/exec/README.md)
* [Facts](./agent/lib/modules/facts/README.md)
* [File](./agent/lib/modules/file/README.md)
* [Package](./agent/lib/modules/package/README.md)
* [Powershell](./agent/lib/modules/poweshell/README.md)
* [Service](./agent/lib/modules/service/README.md)

P2 Language - Policy Files
--------------------------

P2 is a globally available class for expressing the Partout Domain Specific Language (DSL).

p2 is a globally instantiated object from the P2 class.

Anatomy of a Module
-------------------
* See [Anatomy of a Module](./docs/Anatomy_of_a_module.md)

DEVELOPMENT
-----------

### LXD/LXC Agents

*NB: Guests using systemd are not currently supported if running lxd containers unpriviledged.

#### Ubuntu Trusty
```bash
$ lxc launch images:ubuntu/trusty/amd64 ubuntu
$ lxc config device add ubuntu partout disk path=/opt/partout/agent source=/home/bev/Documents/Brackets/partout/agent
$ lxc exec ubuntu bash
```

#### CentOS 6
```bash
$ lxc launch images:centos/6/amd64 centos6
$ lxc config device add centos6 partout disk path=/opt/partout/agent source=/home/bev/Documents/Brackets/partout/agent
$ lxc exec centos6 bash
root@centos6 $ curl --silent --location https://rpm.nodesource.com/setup_5.x | bash -
root@centos6 $ yum -y install nodejs

```

### NFS Agents from Git Sandbox

Prereqs (Debian/Ubuntu):
```bash
# apt-get install -y nfs-client
# curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
# sudo apt-get install -y nodejs
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

Design / Proposal / Brain-Storm Documents
-----------------------------------------

* [PoC bootstrapping agents over a RESTful API](./agent/docs/shell_rest_notes.md)
* [Agent Event Sending Algorythmic Statistical Backoff for Scalability](./docs/Event_Sending_Statistical_Backoff.md)

----

COPYRIGHT
---------
   ```
    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2015-2016 Graham Lee Bevan <graham.bevan@ntlworld.com>

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
