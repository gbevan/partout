Notes on accessing REST APIs from shell using Curl etc for Bootstraping Partout Agent
=====================================================================================

/nodejsManifest
---------------

    curl "https://officepc.net:10443/nodejsManifest?os=linux&arch=x64&bootstrap=1"

returns text file of files to download to install node.js from the master.

/file
-----

    curl "https://officepc.net:10443/file?file=node/linux/x64/include/node/libplatform/libplatform.h"

returns the contents of the requested file.

This method is shared across all *manifest API methods.

/fileAttrs
----------

    curl "https://officepc.net:10443/fileAttrs?file=node/linux/x64/include/node/libplatform/libplatform.h&bootstrap=1"

returns the requested file's mode, in octal.

/agentManifest
--------------

    curl "https://officepc.net:10443/agentManifest?bootstrap=1"

returns text file of files to download to install the Partout agent from the master.
