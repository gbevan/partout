# Module: File

    p2.node([...])
       .file('file or title', options, function (err, stdout, stderr) { ... });

Options:

| Operand     | Type    | Description                            |
|:------------|---------|:---------------------------------------|
| path        | String  | File path, overrides title             |
| ensure      | String  | Present, absent, file, directory, link |
| content     | String  | Content of file, can be object containing {file: 'filaname'} or {template: 'template file'} |
| is_template | Boolean | Content is a template                  |
| mode        | String  | Octal file mode                        |
| owner       | String  | Owner of this file object              |
| group       | String  | Group owner of this file object        |
| watch       | Boolean | Watch this file object for changes and reapply policy |

Templates use the [Mustache](https://www.npmjs.com/package/mustache) templating library.

also supports:

Watches for real-time reapplication of policy when a file object is changed

    .watch(true)
    .file('your_file_to_watch', {ensure: 'file', content: 'template_file'})
    .watch(false)
    ...
