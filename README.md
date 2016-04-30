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

Master Platforms
----------------

Currently supporting:
* Linux

### Prerequisites
* Node.js v4 or above
* ArangoDB (master only) - for Gentoo use ebuild overlay https://github.com/gbevan/portage-arangodb-overlay

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
* [Exec](./agent/lib/modules/exec/README.md)
* [Facts](./agent/lib/modules/facts/README.md)
* [File](./agent/lib/modules/file/README.md)
* [Package](./agent/lib/modules/package/README.md)
* [Powershell](./agent/lib/modules/powershell/README.md)
* [Service](./agent/lib/modules/service/README.md)

P2 Language - Policy Files
--------------------------

p2 is a globally instantiated object from the P2 class, which is the agent Domain Specific Declarative Language.
This is implemented using chained javascript methods - and therefore policies are compiled to native machine code
at run time.

Typically a policy file takes the form of:

    p2
    .exec('cmd')
    .file('file-to-manage', content='whatever {{ Template}}', ...)
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

Quick Sign All Agent CSRs
-------------------------

    bin/partout csr | grep unsigned | awk '{print $1;}' | xargs -i@ bin/partout csr sign @; bin/partout csr

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
