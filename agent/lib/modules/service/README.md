# Module: Service
Manage System Services

    p2.service(
      'title',
      options,
      function (err) {
         ... to be called after applying any action ...
      }
    )

Options:

| Operand    | Type    | Description                                                | Availability |
|:-----------|---------|:-----------------------------------------------------------|:-------------|
| name       | String  | Name of the service to manage (defaults to title) | |
| ensure     | String  | stopped/false, running/true (defaults to stopped) | |
| enabled    | Boolean | true, false, or for Windows: | |
|            | String  | Manual, Automatic(true), Disabled(false), | (create) powershell >= 5.0 |
|            |         | Deleted | |
|            |         | | |
| exec       | String  | Executable binary executable (including path) and any optional arguments. If this option is defined and service does not exist, it will be created. | (only create) powershell >= 5.0 |
| appdir     | String  | Application default directory | (create) powershell >= 5.0 |
| application | String  | Application path (for nssm.exe, e.g. node.exe for nodejs) | (create) powershell >= 5.0 |
| appparams  | String  | Application parameters (e.g. for node.exe would be the server.js file) | (create) powershell >= 5.0 |
|            |         | | |
| srvuser(?) | String  | (proposal) User to run service as | (create) powershell >= 5.0 |
| dependson(?)| Array  | (proposal) List of services this service depends upon | (create) powershell >= 5.0 |
| description| String  | Description of this service | (create) powershell >= 5.0 |
| displayname| String  | Display Name of this service | (create) powershell >= 5.0 |
| provider   | String  | Override backend provider e.g.: debian, redhat, etc | &nbsp; |

Provider Support:
(incomplete module - no unit tests yet)

| Provider   | Support Status | Unit Tests |
|:----------:|:--------------:|:----------:|
| debian     | &#x2713;       | &#x2718;   | (wraps sysv, upstart, TODO: systemd) |
| redhat     | &#x2718;       | &#x2718;   |
| systemd    | &#x2718;       | &#x2718;   |
| sysv       | &#x2713;       | &#x2718;   |
| upstart    | &#x2713;       | &#x2718;   |
| windows    | &#x2713;       | &#x2713;   |
