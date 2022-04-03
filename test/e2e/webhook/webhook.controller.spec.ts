import faker from '@faker-js/faker';
import { EntityManager } from '@mikro-orm/core';
import { INestApplication } from '@nestjs/common';
import { RobotEntity } from '@src/robot/robot.entity';
import { Status } from '@src/task/task.entity';
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

  beforeEach(() => {
    payload = new ReceiveTaskEventDto();
    Object.assign(payload, {
      robotId: faker.datatype.number(),
      taskId: faker.datatype.number(),
      status: faker.random.arrayElement([Status.ABANDONED, Status.COMPLETED]),
    });
  });

  it('should return a 200 when payload is valid', async () => {
    const robot = await em.findOneOrFail(RobotEntity, { id: 1 });
    await taskFactory.createOne({ robot, id: payload.taskId, status: Status.ACTIVE });
    const response = await request(app.getHttpServer()).post(webhookUrl).send(payload);

    expect(response.status).toBe(200);
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
});
