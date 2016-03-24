# Theory and Design of the Automatic Statistical Backoff Algorythm for Agents Sending Events

The idea is to have the Partout Master be able to control and statistically throttle the volume of events being sent by large numbers of agents.

## Event Content

|               | Field | Description |
| :-----------: | :---- | :---------- |
| <sup>1</sup>  | agent_uuid | Agent's unique id |
|               | hostname | Agent's hostname |
|               | arch | Agent's architecture |
|               | platform | Agent's platform |
|               | os_release | Agent's Operating System release |
|               | os_family | Agent's Operating System family |
|               | os_dist_name | Agent's Operating System Distribution name |
|               | os_dist_version_id | Agent's Operating System Distribution version identifier |
| <sup>2</sup>  | module | Name of the agent module sending this event |
| <sup>3</sup>  | object | Name or title of the object subject to this event |
| <sup>4</sup>  | msg | Description of the Event or Action |

<sup>1</sup> Primary agent identifier

<sup>2</sup>

<sup>3</sup>

<sup>4</sup>

## Event Content Throttle Levels

| Level | Aggregates |
| :---: | :--------- |
|   ~~0~~   | ~~Agent alive msgs for at Agent UUID level~~ |
|   1   | Counts by agent_uuid |
|   2   | Counts by agent_uuid & module |
|   3   | Counts by agent_uuid & module & object |
|   4   | Counts by agent_uuid & module & object & msg |

Default starts at level 4.

## Event Throttling by Time Period

Master tells the agent's (via event send responses (POSTs to ```/events```)) to use an event collection period based on:

E<sup>m</sup> = Events per minute arriving at the master

P<sup>s</sup> = Collection Period in seconds

D = Event rate divisor

P<sup>min</sup> = Minimum floor collection period in seconds, e.g. 10 secs

P<sup>max</sup> = Maximum collection period in seconds, whereupon the agents must implement event level aggregation

<p style="font-size: 200%">
P<sup>s</sup> = int(E<sup>m</sup> / D)
</p>

if P<sup>s</sup> < P<sup>min</sup> then P<sup>s</sup> = P<sup>min</sup>

if P<sup>s</sup> > P<sup>max</sup> then P<sup>s</sup> = P<sup>max</sup>

## Event Throttling by Aggregate Level (&ge; P<sup>max</sup>)

if P<sup>s</sup> &ge; P<sup>max</sup> then ...

### Thresholds of E<sup>m</sup> events per minute:
T<sup>obj</sup> = 500

T<sup>mod</sup> = 2000

T<sup>uuid</sup> = 5000

T<sup>max</sup> = 10000

### Calculate Aggregate Level:
if E<sup>m</sup> < T<sup>obj</sup>

&nbsp;&nbsp;A<sup>level</sup> = 4   // all detail

if E<sup>m</sup> &ge; T<sup>obj</sup> & < T<sup>mod</sup>

&nbsp;&nbsp;A<sup>level</sup> = 3   // aggregate at Object

if E<sup>m</sup> &ge; T<sup>mod</sup> & < T<sup>uuid</sup>

&nbsp;&nbsp;A<sup>level</sup> = 2   // aggregate at Module

if E<sup>m</sup> &ge; T<sup>uuid</sup> & < T<sup>max</sup>

&nbsp;&nbsp;A<sup>level</sup> = 1   // aggregate at Agent UUID

~~if E<sup>m</sup> &ge; T<sup>max</sup>~~

~~&nbsp;&nbsp;A<sup>level</sup> = 0   // aggregate on Agent alive msgs (same content as level 1)~~


## Examples of Aggregated Events

    {
      agent: {  // level 0/1
        uuid: ...,
        count: n,
        modules: {  // level 2
          module_name: {
            count: n,
            objects: {  // level 3
              object_name_base64: {
                count: n,
                messages : {  // level 4
                  msg_base64: {
                    level: error|info,
                    count: n
                  }
                }, ...
            }, ...
        }, ...
      },
      period_secs: n
    }

e.g.:

    {
      agent: {
        uuid: '89609ae7-c955-4109-a2b8-4d0e7edcf460',
        count: 1,
        modules: {
          'file': {
            count: 1,
            objects: {
              '8765765jhgfjfhgf876587': {  // for special chars handling
                count: 1,
                messages: {
                  '786576576576dsfsdfsfdsdf976876': {
                    level: 'info',
                    count: 1
                  }
                }
              }
            }
          }
        }
      },
      period_secs: 10
    }

## RESTful API

    POST /events JSON as above

(Note: `/event` api will be deprecated.)

### Events Response for Throttling

The `/events` api will always respond with the current aggregate throttling settings for the agents. e.g.:

    res
    .status(500)
    .send({
      aggregate_period_secs: 60,
      aggregate_period_splay: 0.05,
      aggregate_level: 4,
      notify_alive_period_secs: 60 * 60 * 24
    });

Where:
* `aggregate_period_secs` = P<sup>s</sup>
* `aggregate_level` = 0 - 4
* `notify_alive_period_secs` = final fallback level, notify agent is alive (includes above aggregates counts at uuid detail level 0).

## Aggregate Event Storage

Data will be stored in the ArangoDB database.

### Detail Levels

| Period | Detail Level |
| :----- | :----------- |
| Current day | Raw aggregate data from agents |
| Past 7 days | Hourly aggregates |
| Past 31 days | Daily aggregates |
| Past 365 days (or more) | Weekly aggregates |

## To Concider

Combination of per Master traffic thresholds AND per agent traffic thresholds???
