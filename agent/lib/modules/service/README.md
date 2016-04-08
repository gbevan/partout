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

  | Operand    | Type    | Description                                                |
  |:-----------|---------|:-----------------------------------------------------------|
  | name       | String  | Name of the service to manage (defaults to title) |
  | ensure     | String  | stopped, running (defaults to stopped) |
  | enable     | Boolean | true, false |
  | provider   | String  | Override backend provider e.g.: debian, redhat, etc |
