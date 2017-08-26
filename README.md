Partout
=======

The goal is to develop a pure Javascript/Node.js DevOps Data and Event Driven Policy Based Configuration Management tool for the Internet of Everything.

"Partout" /paʀtu/ - is french for "Everywhere"

See also [this OpenStack Proof-of-concept deployment using Partout](https://github.com/gbevan/partout_openstack_poc).

Licensed under the GNU General Public License Version 3 (GPLv3 - see [COPYING](./COPYING)).

Features
--------

* Integration with operating system provided real-time notification of file system object changes (e.g. linux inotify) to trigger re-scan against policy - real-time repair...
* Policy files compile to native machine code at runtime (expressed as a DSL in Javascript under Node.js - imagine puppet/chef meets d3.js).

Master Platform
---------------

Currently supporting:
* Linux

### Prerequisites
* Node.js v6 or above - see https://nodejs.org/en/download/
* ArangoDB (master only) - see https://www.arangodb.com/download/. For an up to date Gentoo ebuild use overlay https://github.com/gbevan/portage-arangodb-overlay - the current version being used in development is now version 3.2.*

Agent Platforms
---------------

Platforms currently being developed and tested on are:

* Gentoo linux
* Ubuntu Linux (14.04 & 16.04)
* CentOS Linux (6 & 7)
* OpenSuse 13.2
* Oracle Linux (6 & 7)
* Microsoft Windows 10
* Raspberry Pi3 (Raspbian 8 jessie)

(see Agent and Unit-Testing Policies below...)

### Prerequisites
* Node.js v4 or above

Agent and Unit-Testing Policies
-------------------------------

* See [Agent Readme](./agent/README.md)

Modules
-------

* [Command](./agent/lib/modules/command/README.md)
* [Facts](./agent/lib/modules/facts/README.md)
* [File](./agent/lib/modules/file/README.md)
* [Include](./agent/lib/modules/include/README.md)
* [Package](./agent/lib/modules/package/README.md)
* [Powershell](./agent/lib/modules/powershell/README.md)
* [Role](./agent/lib/modules/role/README.md)
* [Service](./agent/lib/modules/service/README.md)
* [User](./agent/lib/modules/user/README.md)

Roles
-----

Roles are very similar in usage to modules, but are coded in much simpler terms utilising the p2 DSL language.

* [See Roles](./agent/lib/roles) (many more are in the pipeline...)

P2 Language - Policy Files
--------------------------

p2 is a globally instantiated object from the P2 class, which is the agent Domain Specific Declarative Language.
This is implemented using chained javascript methods - and therefore policies are compiled to native machine code
at run time.

Typically a policy file takes the form of:

    p2
    .exec('cmd')
    .file('file-to-manage', content='whatever {{ Template }}', ...)
    .powershell('some powershell')
    ...
    ;

(See above Modules for details of the directives)

Anatomy of a Module
-------------------
* See [Anatomy of a Module](./docs/Anatomy_of_a_module.md)

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
