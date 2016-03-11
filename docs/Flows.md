Sending Aggregate Events
========================

Agent
-----

    module calls
      _impl.qEvent({module: '...', object: '...'. msg: '...'})
        \
        p2:_impl.qEvent(o) calls
          GLOBAL.p2_agent_opts.app.master.qEvent(self.facts, o)
            \
            (policy: GLOBAL.p2_agent_opts = self.opts = opts
              <- app: apply(args, opts <- {app: app, daemon: true}))
            |
            master: qEvent(facts, o)
            builds the aggregated events objects, collects for the period
            self.event_detail_aggregate = { ... }
            | on rnd_period
             \
              self.send_aggregate_events_and_reset()
              post /events self.event_detail_aggregate
