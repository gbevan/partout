# Role: User

(Supercedes the previous core user module)

    p2.node([...])
    .user('username', options);

Options:

| Operand     | Type    | Description                            |
|:------------|---------|:---------------------------------------|
| name        | String  | User name, overrides title             |
| ensure      | String  | present or absent - defaults to present |
for the rest see [passwd-group-obj](https://www.npmjs.com/package/passwd-group-obj).


Platform Support (i.e. tested on):

| Platform/OS | Support Status | Unit Tests |
|:------------|:--------------:|:----------:|
| Linux/all   | &#x2713;       | &#x2713;   |
| Windows/10  | &#x2718;       | &#x2718;   |
| Pi/Raspbian jessie  | &#x2713; | &#x2713; |
