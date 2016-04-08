# Module: Exec

     p2.node([...])
       .exec('a command', options, function (err, stdout, stderr) { ... });

Options (from https://nodejs.org/api/child_process.html):

| Operand    | Type   | Description                                                |
|:-----------|--------|:-----------------------------------------------------------|
| cmd        | String | Title is taken as trhe command, otherwise, this argument can override it |
| cwd        | String | Current working directory of the child process |
| env        | Object | Environment key-value pairs |
| encoding   | String | (Default: 'utf8') |
| shell      | String | Shell to execute the command with (Default: '/bin/sh'
|            |        | on UNIX, 'cmd.exe' on Windows, The shell should understand |
|            |        | the -c switch on UNIX or /s /c on Windows. On Windows, |
|            |        | command line parsing should be compatible with cmd.exe.) |
| timeout    | Number | (Default: 0) |
| maxBuffer  | Number | (Default: 200*1024) |
| killSignal | String | (Default: 'SIGTERM') |
| uid        | Number | Sets the user identity of the process. (See setuid(2).) |
| gid        | Number | Sets the group identity of the process. (See setgid(2).) |

also supports:
- creates: 'file' - test file does not exist, otherwise skip.
- returns: expected return code on error to be ignored.
