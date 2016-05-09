# Module: Package

Manage System Packages

    p2.package(
      'title or pkg name',
      options,
      function (err, stdout, stderr) {
        ... to be called after exec of pkg command ...
      }
    )

Options:

| Operand    | Type    | Description                                                |
|:-----------|---------|:-----------------------------------------------------------|
| name       | String  | Package name to install (defaults to title) |
| ensure     | String  | present/installed, absent/purged, latest (default is present) |
| provider   | String  | Override backend provider e.g.: apt, yum, rpm, etc |

Platform Support (i.e. tested on):
(incomplete module - no unit tests yet)

| Platform/OS | Support Status |
|:------------|:--------------:|
| Linux/all   | &#x2718; |
| Windows/10  | &#x2718; |
| Pi/Raspbian jessie  | &#x2718; |

Actions are available for these providers:
* apt
* npm
* yum
