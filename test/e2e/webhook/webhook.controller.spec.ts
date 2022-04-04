import faker from '@faker-js/faker';
import { EntityManager } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { RobotEntity } from '@src/robot/robot.entity';
import { Priority, Status, TaskEntity } from '@src/task/task.entity';
import { ReceiveTaskEventDto } from '@src/webhook/dto/receive-task-event.dto';
import { TaskFactory } from '@test/factories/task.factory';
import { bootstrapTestApp } from '@test/utils/bootstrap-test-app';
import { getErrorMessages, MUST_BE_ENUM_MESSAGE } from '@test/utils/validation-message';
import request from 'supertest';

describe('WebhookController e2e tests', () => {
  const webhookUrl = '/v1/webhooks/tasks';
  let app: INestApplication;
  let payload: ReceiveTaskEventDto;
  let em: EntityManager;
  let taskFactory: TaskFactory;

  beforeAll(async () => {
    app = await bootstrapTestApp();
    em = app.get<EntityManager>(EntityManager).fork();
    taskFactory = new TaskFactory(em);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    payload = new ReceiveTaskEventDto();
    Object.assign(payload, {
      robotId: 1,
      taskId: faker.datatype.number(),
      status: faker.random.arrayElement([Status.ABANDONED, Status.COMPLETED]),
    });

    await em.nativeDelete(TaskEntity, {});
  });

  it('should return a 204 when payload is valid', async () => {
    const robot = await em.findOneOrFail(RobotEntity, { id: 1 });
    await taskFactory.createOne({ robot, id: payload.taskId, status: Status.ACTIVE });
    const response = await request(app.getHttpServer()).post(webhookUrl).send(payload);

    expect(response.status).toBe(204);
  });

  it.each([null, undefined, '', 'foo', '1', true])('should return a 400 if robotId is %s', async (robotId) => {
    Object.assign(payload, { robotId });
    const response = await request(app.getHttpServer()).post(webhookUrl).send(payload);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: expect.arrayContaining(getErrorMessages(robotId, 'robotId', 'int')),
    });
  });

  it.each([null, undefined, '', 'foo', '1', true])('should return a 400 if taskId is %s', async (taskId) => {
    Object.assign(payload, { taskId });
    const response = await request(app.getHttpServer()).post(webhookUrl).send(payload);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: expect.arrayContaining(getErrorMessages(taskId, 'taskId', 'int')),
    });
  });

  it.each([null, undefined, '', 'foo', true, Status.ACTIVE, Status.QUEUED])(
    'should return a 400 if status is %s',
    async (status) => {
      Object.assign(payload, { status });
      const response = await request(app.getHttpServer()).post(webhookUrl).send(payload);

      const errorMessages = getErrorMessages(status, 'status', 'enum');
      errorMessages.push('status must be one of the following values: ABANDONED, COMPLETED');

      if (status === Status.ACTIVE || status === Status.QUEUED) {
        const mustBeEnumIndex = errorMessages.findIndex((i) => i.endsWith(MUST_BE_ENUM_MESSAGE));
        errorMessages.splice(mustBeEnumIndex, 1);
      }

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        message: expect.arrayContaining(errorMessages),
      });
    },
  );

  it('should dispatch the next available task', async () => {
    const robot = await em.findOneOrFail(RobotEntity, { id: 1 });

    const firstTask = await taskFactory.createOne({ robot, id: payload.taskId, status: Status.ACTIVE });
    const nextTask = await taskFactory.createOne({ robot, status: Status.QUEUED });

    const responseBeforeFinishingTask = await request(app.getHttpServer()).get('/v1/robots/1').send();
    const webhookResponse = await request(app.getHttpServer()).post(webhookUrl).send(payload);
    const responseAfterFinishingTask = await request(app.getHttpServer()).get('/v1/robots/1').send();

    expect(webhookResponse.status).toBe(204);
    expect(responseBeforeFinishingTask.body).toMatchObject({
      activeTask: {
        id: firstTask.id,
        status: firstTask.status,
      },
      taskQueue: [
        expect.objectContaining({
          id: nextTask.id,
          status: Status.QUEUED,
        }),
      ],
    });
    expect(responseAfterFinishingTask.body).toMatchObject({
      activeTask: {
        id: nextTask.id,
        status: Status.ACTIVE,
      },
      taskHistory: [
        expect.objectContaining({
          id: firstTask.id,
          status: payload.status,
        }),
      ],
    });
  });

  it('should dispatch the task with the lowest taskTimeSeconds', async () => {
    const robot = await em.findOneOrFail(RobotEntity, { id: 1 });
    const firstTask = await taskFactory.createOne({ robot, id: payload.taskId, status: Status.ACTIVE });

    const mediumTask = await taskFactory.createOne({ robot, status: Status.QUEUED, priority: Priority.MEDIUM });
    const highTask = await taskFactory.createOne({ robot, status: Status.QUEUED, priority: Priority.HIGH });
    const lowTask = await taskFactory.createOne({ robot, status: Status.QUEUED, priority: Priority.LOW });

    const responseBeforeFinishingTask = await request(app.getHttpServer()).get('/v1/robots/1').send();
    const webhookResponse = await request(app.getHttpServer()).post(webhookUrl).send(payload);
    const responseAfterFinishingTask = await request(app.getHttpServer()).get('/v1/robots/1').send();

    expect(webhookResponse.status).toBe(204);
    expect(responseBeforeFinishingTask.body).toMatchObject({
      activeTask: {
        id: firstTask.id,
        status: firstTask.status,
      },
      taskQueue: expect.arrayContaining([
        expect.objectContaining({
          id: mediumTask.id,
          priority: mediumTask.priority,
          status: Status.QUEUED,
        }),
        expect.objectContaining({
          id: highTask.id,
          priority: highTask.priority,
          status: Status.QUEUED,
        }),
        expect.objectContaining({
          id: lowTask.id,
          priority: lowTask.priority,
          status: Status.QUEUED,
        }),
      ]),
    });
    expect(responseAfterFinishingTask.body).toMatchObject({
      activeTask: {
        id: highTask.id,
        priority: highTask.priority,
        status: Status.ACTIVE,
      },
      taskQueue: expect.arrayContaining([
        expect.objectContaining({
          id: mediumTask.id,
          priority: mediumTask.priority,
          status: Status.QUEUED,
        }),
        expect.objectContaining({
          id: lowTask.id,
          priority: lowTask.priority,
          status: Status.QUEUED,
        }),
      ]),
      taskHistory: [
        expect.objectContaining({
          id: firstTask.id,
          priority: firstTask.priority,
          status: payload.status,
        }),
      ],
    });
  });

  it('should dispatch the highest priority task', async () => {
    const robot = await em.findOneOrFail(RobotEntity, { id: 1 });
    const firstTask = await taskFactory.createOne({ robot, id: payload.taskId, status: Status.ACTIVE });

    const longTask = await taskFactory.createOne({
      robot,
      status: Status.QUEUED,
      priority: Priority.HIGH,
      taskTimeSeconds: 3,
    });
    const shortTask = await taskFactory.createOne({
      robot,
      status: Status.QUEUED,
      priority: Priority.HIGH,
      taskTimeSeconds: 1,
    });
    const mediumTask = await taskFactory.createOne({
      robot,
      status: Status.QUEUED,
      priority: Priority.HIGH,
      taskTimeSeconds: 2,
    });

    const responseBeforeFinishingTask = await request(app.getHttpServer()).get('/v1/robots/1').send();
    const webhookResponse = await request(app.getHttpServer()).post(webhookUrl).send(payload);
    const responseAfterFinishingTask = await request(app.getHttpServer()).get('/v1/robots/1').send();

    expect(webhookResponse.status).toBe(204);
    expect(responseBeforeFinishingTask.body).toMatchObject({
      activeTask: {
        id: firstTask.id,
        status: firstTask.status,
      },
      taskQueue: expect.arrayContaining([
        expect.objectContaining({
          id: longTask.id,
          taskTimeSeconds: longTask.taskTimeSeconds,
          status: Status.QUEUED,
        }),
        expect.objectContaining({
          id: shortTask.id,
          taskTimeSeconds: shortTask.taskTimeSeconds,
          status: Status.QUEUED,
        }),
        expect.objectContaining({
          id: mediumTask.id,
          taskTimeSeconds: mediumTask.taskTimeSeconds,
          status: Status.QUEUED,
        }),
      ]),
    });
    expect(responseAfterFinishingTask.body).toMatchObject({
      activeTask: {
        id: shortTask.id,
        taskTimeSeconds: shortTask.taskTimeSeconds,
        status: Status.ACTIVE,
      },
      taskQueue: expect.arrayContaining([
        expect.objectContaining({
          id: longTask.id,
          taskTimeSeconds: longTask.taskTimeSeconds,
          status: Status.QUEUED,
        }),
        expect.objectContaining({
          id: mediumTask.id,
          taskTimeSeconds: mediumTask.taskTimeSeconds,
          status: Status.QUEUED,
        }),
      ]),
      taskHistory: [
        expect.objectContaining({
          id: firstTask.id,
          taskTimeSeconds: firstTask.taskTimeSeconds,
          status: payload.status,
        }),
      ],
    });
  });

  it('should dispatch the highest priority task with the shortest taskTimeSeconds', async () => {
    const robot = await em.findOneOrFail(RobotEntity, { id: 1 });
    const firstTask = await taskFactory.createOne({ robot, id: payload.taskId, status: Status.ACTIVE });

    const mediumPriorityLongTask = await taskFactory.createOne({
      robot,
      status: Status.QUEUED,
      priority: Priority.MEDIUM,
      taskTimeSeconds: 3,
    });
    const mediumPriorityShortTask = await taskFactory.createOne({
      robot,
      status: Status.QUEUED,
      priority: Priority.MEDIUM,
      taskTimeSeconds: 1,
    });
    const mediumPriorityMediumTask = await taskFactory.createOne({
      robot,
      status: Status.QUEUED,
      priority: Priority.MEDIUM,
      taskTimeSeconds: 2,
    });

    const highPriorityLongTask = await taskFactory.createOne({
      robot,
      status: Status.QUEUED,
      priority: Priority.HIGH,
      taskTimeSeconds: 3,
    });
    const highPriorityShortTask = await taskFactory.createOne({
      robot,
      status: Status.QUEUED,
      priority: Priority.HIGH,
      taskTimeSeconds: 1,
    });
    const highPriorityMediumTask = await taskFactory.createOne({
      robot,
      status: Status.QUEUED,
      priority: Priority.HIGH,
      taskTimeSeconds: 2,
    });

    const lowPriorityLongTask = await taskFactory.createOne({
      robot,
      status: Status.QUEUED,
      priority: Priority.LOW,
      taskTimeSeconds: 3,
    });
    const lowPriorityShortTask = await taskFactory.createOne({
      robot,
      status: Status.QUEUED,
      priority: Priority.LOW,
      taskTimeSeconds: 1,
    });
    const lowPriorityMediumTask = await taskFactory.createOne({
      robot,
      status: Status.QUEUED,
      priority: Priority.LOW,
      taskTimeSeconds: 2,
    });

    const responseBeforeFinishingTask = await request(app.getHttpServer()).get('/v1/robots/1').send();
    const webhookResponse = await request(app.getHttpServer()).post(webhookUrl).send(payload);
    const responseAfterFinishingTask = await request(app.getHttpServer()).get('/v1/robots/1').send();

    expect(webhookResponse.status).toBe(204);
    expect(responseBeforeFinishingTask.body).toMatchObject({
      activeTask: {
        id: firstTask.id,
        status: firstTask.status,
      },
      taskQueue: expect.arrayContaining([
        expect.objectContaining({
          id: mediumPriorityLongTask.id,
          priority: mediumPriorityLongTask.priority,
          taskTimeSeconds: mediumPriorityLongTask.taskTimeSeconds,
          status: Status.QUEUED,
        }),
        expect.objectContaining({
          id: mediumPriorityShortTask.id,
          priority: mediumPriorityShortTask.priority,
          taskTimeSeconds: mediumPriorityShortTask.taskTimeSeconds,
          status: Status.QUEUED,
        }),
        expect.objectContaining({
          id: mediumPriorityMediumTask.id,
          priority: mediumPriorityMediumTask.priority,
          taskTimeSeconds: mediumPriorityMediumTask.taskTimeSeconds,
          status: Status.QUEUED,
        }),
        expect.objectContaining({
          id: highPriorityLongTask.id,
          priority: highPriorityLongTask.priority,
          taskTimeSeconds: highPriorityLongTask.taskTimeSeconds,
          status: Status.QUEUED,
        }),
        expect.objectContaining({
          id: highPriorityShortTask.id,
          priority: highPriorityShortTask.priority,
          taskTimeSeconds: highPriorityShortTask.taskTimeSeconds,
          status: Status.QUEUED,
        }),
        expect.objectContaining({
          id: highPriorityMediumTask.id,
          priority: highPriorityMediumTask.priority,
          taskTimeSeconds: highPriorityMediumTask.taskTimeSeconds,
          status: Status.QUEUED,
        }),
        expect.objectContaining({
          id: lowPriorityLongTask.id,
          priority: lowPriorityLongTask.priority,
          taskTimeSeconds: lowPriorityLongTask.taskTimeSeconds,
          status: Status.QUEUED,
        }),
        expect.objectContaining({
          id: lowPriorityShortTask.id,
          priority: lowPriorityShortTask.priority,
          taskTimeSeconds: lowPriorityShortTask.taskTimeSeconds,
          status: Status.QUEUED,
        }),
        expect.objectContaining({
          id: lowPriorityMediumTask.id,
          priority: lowPriorityMediumTask.priority,
          taskTimeSeconds: lowPriorityMediumTask.taskTimeSeconds,
          status: Status.QUEUED,
        }),
      ]),
    });
    expect(responseAfterFinishingTask.body).toMatchObject({
      activeTask: {
        id: highPriorityShortTask.id,
        taskTimeSeconds: highPriorityShortTask.taskTimeSeconds,
        status: Status.ACTIVE,
      },
      taskQueue: expect.arrayContaining([
        expect.objectContaining({
          id: mediumPriorityLongTask.id,
          priority: mediumPriorityLongTask.priority,
          taskTimeSeconds: mediumPriorityLongTask.taskTimeSeconds,
          status: Status.QUEUED,
        }),
        expect.objectContaining({
          id: mediumPriorityShortTask.id,
          priority: mediumPriorityShortTask.priority,
          taskTimeSeconds: mediumPriorityShortTask.taskTimeSeconds,
          status: Status.QUEUED,
        }),
        expect.objectContaining({
          id: mediumPriorityMediumTask.id,
          priority: mediumPriorityMediumTask.priority,
          taskTimeSeconds: mediumPriorityMediumTask.taskTimeSeconds,
          status: Status.QUEUED,
        }),
        expect.objectContaining({
          id: highPriorityLongTask.id,
          priority: highPriorityLongTask.priority,
          taskTimeSeconds: highPriorityLongTask.taskTimeSeconds,
          status: Status.QUEUED,
        }),
        expect.objectContaining({
          id: highPriorityMediumTask.id,
          priority: highPriorityMediumTask.priority,
          taskTimeSeconds: highPriorityMediumTask.taskTimeSeconds,
          status: Status.QUEUED,
        }),
        expect.objectContaining({
          id: lowPriorityLongTask.id,
          priority: lowPriorityLongTask.priority,
          taskTimeSeconds: lowPriorityLongTask.taskTimeSeconds,
          status: Status.QUEUED,
        }),
        expect.objectContaining({
          id: lowPriorityShortTask.id,
          priority: lowPriorityShortTask.priority,
          taskTimeSeconds: lowPriorityShortTask.taskTimeSeconds,
          status: Status.QUEUED,
        }),
        expect.objectContaining({
          id: lowPriorityMediumTask.id,
          priority: lowPriorityMediumTask.priority,
          taskTimeSeconds: lowPriorityMediumTask.taskTimeSeconds,
          status: Status.QUEUED,
        }),
      ]),
      taskHistory: [
        expect.objectContaining({
          id: firstTask.id,
          taskTimeSeconds: firstTask.taskTimeSeconds,
          status: payload.status,
        }),
      ],
    });
  });
});
