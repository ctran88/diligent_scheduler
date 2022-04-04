## Description

Project to schedule and dispatch prioritized tasks to a robot.

The idea of this service is that it acts as the scheduler and dispatcher of tasks for its robots. It is initially seeded with the robot, Moxie, but other robots can be added as well.

Robot actions will be assumed by a human for this project.

Tasks can be created for specific robots and the robots (or human) will send events to this service's webhook when it has either `COMPLETED` or `ABANDONED` its current task. A robot cannot multitask and may only have one active task at a time. Once a robot lets the service know it is finished with its currently active task, it will automatically be assigned another one if there are any left in its task queue.

The active task, task queue, and task history can all be seen when inspecting a robot.

## Installation

```bash
$ npm i
```

## Running the app

```bash
# start application
$ npm start
```

## Test

```bash
# all tests
$ npm test

# unit tests
$ npm test unit

# e2e tests
$ npm test e2e

# test coverage
$ npm run test:cov
```

## Swagger docs
```
http://localhost:3000/api-doc
```

## Instructions

1. Import the [diligent-scheduler.postman_collection.json](/diligent-scheduler.postman_collection.json) file into `Postman`.
2. Run the requests in the collection in order. Steps 1-4 setup the initial state and data. Steps 5 dispatches the next highest priority task and Step 6 shows the result.
3. Repeat steps 5 and 6 to continue cycling through the tasks to verify the results.

This combinatory test of task priority and time is also located [here](https://github.com/ctran88/diligent_scheduler/blob/b2b0aa789e5f5e22fdada409f39425a196db7128/test/e2e/webhook/webhook.controller.spec.ts#L269) as an e2e test.

The logic for this task prioritization is located [here](https://github.com/ctran88/diligent_scheduler/blob/e924bdb9c4ddf60b77540c6df275e4c8c16aa1d5/src/task/task.entity.ts#L35) to set a custom order for the `priority` field and [here](https://github.com/ctran88/diligent_scheduler/blob/e924bdb9c4ddf60b77540c6df275e4c8c16aa1d5/src/task/task.service.ts#L17) as a SQL statement.

Everything is stored in memory with SQLite, so just `ctrl + c` and `npm start` to reset the application state.

## Trade-offs for this exercise
- A separate service for the robot has been scoped out of this project and those actions are instead performed by a human interacting with this API.
- The `RobotEntity` data model is very slim since this is focused on the scheduling logic.
- `taskTimeSeconds` was added to the payload to make it easier to test different scenarios, but in reality this should be a relatively known quantity with a more rigid data structure.
- Task `name` was added to make it easier to verify test cases, but this should also be a predefined list of actions, perhaps specific to the robot or hospital system it is working in.
- Validation for max `taskTimeSeconds` was set to an arbitrary number that seemed reasonable for a long-running task. Although there could be a valid longer running task, the idea of this max limit was to defend against a malicious actor that tries to push an extremely long-running task to a robot to lock it up for an extended period of time. Again, this is mitigated by having predefined tasks and known run times that come from training the robot.
- `updatedBy` was added to the payload to differentiate between different clients sending the same robot different tasks, but this should normally be retrieved from the authentication mechanism.
- All IDs are integers instead of UUIDs for ease of verification while testing.
- There are no authentication or authorization mechanisms in place for simplicity.
- Did not containerize this service since the image took over 10 minutes to build.

## Technicaml improvements to be made
- More and better logging.
- Implement logic to actually send communications to the robot instead of just logging message.
- More robust and secure communication protocols, i.e. requiring an ACK from the robot over TLS before completing a transaction.
- Batch dispatch tasks to the robot.
- Validation that there can only be one active task at a time in the task table.
- Validation to check if the task that is being reported as finished was in an active state before.
- Better atomicity or confirmation for updating finished tasks and dispatching the next one.
- Logic to determine if a robot is idle and still has tasks in the queue.
- Unit test for `WebhookController` to make sure it's calling the `DispatchService`. This was not added due to trouble configuring ORM with the test suite correctly.
- Better DTO for `TaskEntity` to not show redundant data from the `robot` field.
- More flexible configuration for both scheduler and robot.
- Find a better way to support batch creating tasks. Would prefer an array of `CreateTaskDto` instead of an object with a `tasks: CreateTaskDto[]` property. Couldn't find a away to do that and keep validation though.
- Add a Kafka broker and zookeeper service with a consumer/producer pattern to push events on a topic instead of direct communication between the service and robot.
- More scalable prioritization logic. Once the `tasks` table starts accruing hundreds of thousands of records, using a SQL query to sort it each time will become very slow.
- Add routing logic so that a robot may multitask and perform multiple actions at once if it can hold multiple items and deliver them to a single or multiple destinations in a similar vicinity.

## Design questions
> What components may be required to accomplish this on a high level?

#### Data storage
A durable data store would be required to track and store tasks. This is especially important to maintain data integrity if services go down. A relational database should be sufficient to store most kinds of data models; however, if it is also necessary to persist the detailed contents of what the robot is transporting, i.e. specific document data, then a NoSQL database might be better.

#### Load balancing and Disaster recovery
Several pods should be available in each cluster to load balance and keep a high level of reliablity. A consideration for having clusters in several regions could be considered to minimize network latency. Highly available services and databases should be setup in a hot/hot or hot/warm solution. Depending on the current or expected number of transactions per second, this might have to be replicated in near real-time in order to mitigate data loss.

#### Other services and components
While this application is running as a single service for the sake of this exercise, it would not scale well. It might be preferable to have a dedicated dispatch service with an eventing system like Kafka to broker the events between the core services and robots.

#### Authentication and authorization
A third-party authentication system would be necessary to to secure the platform, especially since it is dealing with sensitive information with real-life consequences via the robot's actions. A form of authorization like RBAC, ABAC, or PBAC would also be necessary to compartmentalize user access. Since there would likely be several services, there should be consideration as to whether they should communicate in a zero-trust or implicit-trust environment.

#### Observability, monitoring, and alerting
Distributed tracing and logging libraries/services should be used to help troubleshoot problems, audit user actions, and possibly stay compliant with HIPAA or GDPR regulations depending on what information is being stored. Third-party platforms to parse logs, monitor health, and alert on desired events or exceptions should be put in place.

> What kind of tooling, frameworks, design patterns, etc would you use for these requirements in a production-setting?

Cloud platforms like AWS or GCP are great for maintaining highly available services, data stores, and infrastructure.

Infrastructure tools like Kubernetes, Istio, TerraForm, Helm, and CircleCI are very helpful for streamlining, stabilizing, and conforming the SDLC and CI/CD pipeline for consistent, quality deployments.

Message and event brokers like Kafka, RabbitMQ, or Redis will become more necessary as services and communication volume begin to scale.

Tools like Grafana, Prometheus, Sentry, PagerDuty, and Segment help sort out large amounts of data revolving around service metrics, application logging, exception alerting, and business analytics.

Although Node.js/NestJS was used for this project, consideration should be given to other tech stacks that have different flexibility around multithreading, CPU- or I/O-bound processes, caching, memory usage, network performance, and overall throughput. Depending on the needs of the business and nature of the product one stack might be much better suited or limiting than another.

Unlike embedded programming for a robot, frameworks, tooling, and design patterns for cloud-based core services allow for much more leeway. Less efficiency for better readability, maintenance, and extension would be preferable. The standard OOP patterns should be sufficient.

## Open questions
- Should a robot manage its own task queue?
- Should the source of truth for queued tasks be the robot or a central service?
- How should failed communications be handled? What kind of retry logic should be used?
- How should we ensure a robot is not duplicating or dropping tasks?
- Should tasks be prioritized by expected runtime or by using a predictive model for actual runtime? i.e. if the pharmacy is backed up or unexpectedly closed that day, how can the task prioritization be adjusted on the fly?