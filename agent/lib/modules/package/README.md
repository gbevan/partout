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

Provider Support:
(incomplete module - no unit tests yet)

| Provider   | Support Status | Unit Tests |
|:----------:|:--------------:|:----------:|
| apt        | &#x2713;       | &#x2713;   |
| gem        | &#x2718;       | &#x2718;   |
| npm        | &#x2713;       | &#x2718;   |
| pip        | &#x2718;       | &#x2718;   |
| portage    | &#x2718;       | &#x2718;   |
| rpm        | &#x2718;       | &#x2718;   |
| yum        | &#x2713;       | &#x2718;   |
| zypp       | &#x2718;       | &#x2718;   |
| winfeature | &#x2718;       | &#x2718;   |
| chocolatey | &#x2718;       | &#x2718;   |
