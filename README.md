## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm i
```

## Running the app

```bash
# production mode
$ npm run start:prod
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

## Trade-offs for this exercise
- Task time was added to the payload to make it easier to test different scenarios, but in reality this should be a known quantity with a more rigid data structure.
- Task name was added to make it easier to verify test cases, but this should also be a predefined list of actions, perhaps specific to the robot or hospital system it is working in.
- Set validation for max task time to an arbitrarily high number that seemed reasonable for a long-running task. Although there could be a valid longer running task, the idea of this max limit was to defend against a malicious actor that tries to push an extremely long-running task to a robot to lock it up for an extended period of time. Again, this is mitigated by having predefined tasks and known run times from training the robot.

## Technicaml improvements to be made
- More robust communication with robot, i.e. requiring an ACK before completing a transaction with the robot.
- Batching tasks to the robot.
- Validation that there can only be one active task at a time in the task table.