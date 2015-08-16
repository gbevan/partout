Partout
=======

Pure Javascript Data and Event Driven Policy Based Configuration Management for the Internet of Everything.

"Partout" is french for "Everywhere"

Modules
-------

### facts
Takes no parameters and is called internally before any other modules, to gather facts about the target system.

### exec
Execute commands.

### file
Manage files, includes the [Mustache](https://github.com/janl/mustache.js) templating library.

P2 Language - Policy Files
--------------------------

P2 is a globally available class for expressing the Partout Domain Specific Language (DSL).

p2 is a globally instantiated object from the P2 class.
