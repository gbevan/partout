Partout
=======

Pure Javascript Data and Event Driven Policy Based Configuration Management for the Internet of Everything.

"Partout" is french for "Everywhere"

Modules
-------

### facts
Takes no parameters and is called internally before any other modules, to gather facts about the target system.

If any module contains a method called getFacts, it will be called during fact discover, prior to module execution.

### exec
Execute commands.

### file
Manage files, includes the [Mustache](https://github.com/janl/mustache.js) templating library.

Discovered facts are made available to the templating engine.

P2 Language - Policy Files
--------------------------

P2 is a globally available class for expressing the Partout Domain Specific Language (DSL).

p2 is a globally instantiated object from the P2 class.


COPYRIGHT
---------

    Partout [Everywhere] - Policy-Based Configuration Management for the
    Data-Driven-Infrastructure.

    Copyright (C) 2015  Graham Lee Bevan <graham.bevan@ntlworld.com>

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
