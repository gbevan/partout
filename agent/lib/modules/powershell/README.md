# Module: Powershell

     p2.node([...])
       .powershell('a powershell scriptlet', options, function (err, stdout, stderr) { ... });

Options (from https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options):

| Operand    | Type   | Description                                                |
|:-----------|--------|:-----------------------------------------------------------|
| cmd        | String | Title is taken as the powershell, otherwise, this argument can override it |
| cwd        | String | Current working directory of the child process |
| env        | Object | Environment key-value pairs |
| uid        | Number | Sets the user identity of the process. (See setuid(2).) |
| gid        | Number | Sets the group identity of the process. (See setgid(2).) |

also supports:

| Operand    | Type   | Description                                                |
|:-----------|--------|:-----------------------------------------------------------|
| creates    | String | 'file' - test file does not exist, otherwise skip.         |
| returns    | Number |  expected return code on error to be ignored.              |
| onlyif     | String | powershell to test if exec should be run, rc=0 means run cmd. |
|            | Object | {file: 'filename'} execute powershell content of file.   |

Platform Support (i.e. tested on):

| Platform/OS | Support Status |
|:------------|:--------------:|
| Windows/10  | &#x2713; |
