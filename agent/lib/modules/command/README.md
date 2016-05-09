# Module: Command

     p2.node([...])
       .command('a command', options, function (err, stdout, stderr) { ... });

Options (from https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options):

| Operand    | Type   | Description                                                |
|:-----------|--------|:-----------------------------------------------------------|
| cmd        | String | Title is taken as trhe command, otherwise, this argument can override it. On linux/unix this is a shell command, on windows this is a DOS command - see powershell module for another option. |
| cwd        | String | Current working directory of the child process |
| env        | Object | Environment key-value pairs |
| uid        | Number | Sets the user identity of the process. (See setuid(2).) |
| gid        | Number | Sets the group identity of the process. (See setgid(2).) |

also supports:

| Operand    | Type   | Description                                                |
|:-----------|--------|:-----------------------------------------------------------|
| creates    | String | 'file' - test file does not exist, otherwise skip.         |
| returns    | Number |  expected return code on error to be ignored.              |
| onlyif     | String | command to test if exec should be run, rc=0 means run cmd. |
|            | Object | {file: 'filename'} execute content of file.   |

Platform Support (i.e. tested on):

| Platform/OS | Support Status |
|:------------|:--------------:|
| Linux/all   | &#x2713; |
| Windows/10  | &#x2713; |
| Pi/Raspbian jessie  | &#x2713; |
