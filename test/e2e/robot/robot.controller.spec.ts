import { EntityManager } from '@mikro-orm/core';
import { faker } from '@mikro-orm/seeder';
import { INestApplication } from '@nestjs/common';
import { CreateRobotDto } from '@src/robot/dtos/create-robot.dto';
import { RobotEntity } from '@src/robot/robot.entity';
import { CreateTaskDto } from '@src/task/dto/create-task.dto';
import { CreateTasksDto } from '@src/task/dto/create-tasks.dto';
import { Priority, Status, TaskEntity } from '@src/task/task.entity';
import { RobotFactory } from '@test/factories/robot.factory';
import { TaskFactory } from '@test/factories/task.factory';
import { bootstrapTestApp } from '@test/utils/bootstrap-test-app';
import { getErrorMessages } from '@test/utils/validation-message';
import request from 'supertest';

describe('RobotController e2e tests', () => {
  let app: INestApplication;
  let em: EntityManager;
  let robotFactory: RobotFactory;
  let taskFactory: TaskFactory;

  beforeAll(async () => {
    app = await bootstrapTestApp();
    em = app.get<EntityManager>(EntityManager).fork();
    robotFactory = new RobotFactory(em);
    taskFactory = new TaskFactory(em);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await em.nativeDelete(TaskEntity, {});
  });

  describe('[GET]', () => {
    const robotsUrl = '/v1/robots';

    describe('all', () => {
      it('should retrieve the default robot', async () => {
        const response = await request(app.getHttpServer()).get(robotsUrl);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject([
          {
            id: 1,
            name: 'Moxie',
          },
        ]);
      });

      it('should retrieve all robots', async () => {
        const robot = await robotFactory.createOne();

        const response = await request(app.getHttpServer()).get(robotsUrl);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject([
          {
            id: 1,
            name: 'Moxie',
          },
          {
            id: robot.id,
            name: robot.name,
          },
        ]);
      });
    });

    describe('by id', () => {
      const getByIdUrl = `${robotsUrl}/1`;

      it('should retrieve the correct robot by id', async () => {
        const response = await request(app.getHttpServer()).get(getByIdUrl);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          id: 1,
          name: 'Moxie',
        });
      });

      it('should return a 400 if given a non-integer id', async () => {
        const response = await request(app.getHttpServer()).get(`${robotsUrl}/foo`);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          message: 'Validation failed (numeric string is expected)',
        });
      });

      it('should return an active task when task.status is ACTIVE', async () => {
        const robot = await em.findOneOrFail(RobotEntity, { id: 1 });
        const task = await taskFactory.createOne({ robot, status: Status.ACTIVE });

        robot.tasks.add(task);
        await em.persistAndFlush(robot);

        const response = await request(app.getHttpServer()).get(getByIdUrl);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          id: 1,
          name: 'Moxie',
          activeTask: {
            id: task.id,
            robot: robot.id,
            status: task.status,
          },
        });
      });

      it('should return queued tasks when task.status is QUEUED', async () => {
        const robot = await em.findOneOrFail(RobotEntity, { id: 1 });
        const task = await taskFactory.createOne({ robot, status: Status.QUEUED });

        robot.tasks.add(task);
        await em.persistAndFlush(robot);

        const response = await request(app.getHttpServer()).get(getByIdUrl);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          id: 1,
          name: 'Moxie',
          taskQueue: [
            {
              id: task.id,
              robot: robot.id,
              status: task.status,
            },
          ],
        });
      });

      it('should return historical tasks when task.status is COMPLETED or ABANDONED', async () => {
        const robot = await em.findOneOrFail(RobotEntity, { id: 1 });
        const taskCompleted = await taskFactory.createOne({ robot, status: Status.COMPLETED });
        const taskAbandoned = await taskFactory.createOne({ robot, status: Status.ABANDONED });

        robot.tasks.add(taskCompleted, taskAbandoned);
        await em.persistAndFlush(robot);

        const response = await request(app.getHttpServer()).get(getByIdUrl);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          id: 1,
          name: 'Moxie',
          taskHistory: expect.arrayContaining([
            expect.objectContaining({
              id: taskCompleted.id,
              robot: robot.id,
              status: taskCompleted.status,
            }),
            expect.objectContaining({
              id: taskAbandoned.id,
              robot: robot.id,
              status: taskAbandoned.status,
            }),
          ]),
        });
      });

      it('should return the correct active, queued, and historical tasks', async () => {
        const robot = await em.findOneOrFail(RobotEntity, { id: 1 });

        const taskActive = await taskFactory.createOne({ robot, status: Status.ACTIVE });
        const taskQueued = await taskFactory.createOne({ robot, status: Status.QUEUED });
        const taskCompleted = await taskFactory.createOne({ robot, status: Status.COMPLETED });
        const taskAbandoned = await taskFactory.createOne({ robot, status: Status.ABANDONED });

        robot.tasks.add(taskActive, taskQueued, taskCompleted, taskAbandoned);
        await em.persistAndFlush(robot);

        const response = await request(app.getHttpServer()).get(getByIdUrl);

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          id: 1,
          name: 'Moxie',
          activeTask: {
            id: taskActive.id,
            robot: robot.id,
            status: taskActive.status,
          },
          taskQueue: [
            {
              id: taskQueued.id,
              robot: robot.id,
              status: taskQueued.status,
            },
          ],
          taskHistory: expect.arrayContaining([
            expect.objectContaining({
              id: taskCompleted.id,
              robot: robot.id,
              status: taskCompleted.status,
            }),
            expect.objectContaining({
              id: taskAbandoned.id,
              robot: robot.id,
              status: taskAbandoned.status,
            }),
          ]),
        });
      });
    });
  });

  describe('[POST]', () => {
    const robotsUrl = '/v1/robots';

    describe('robots', () => {
      let payload: CreateRobotDto;

      beforeEach(() => {
        payload = new CreateRobotDto();
        Object.assign(payload, { name: faker.name.firstName() });
      });

      it('should create a new robot', async () => {
        const response = await request(app.getHttpServer()).post(robotsUrl).send(payload);

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject(payload);
      });

      it.each([null, undefined, '', true, 1])('should return a 400 if name is %s', async (name) => {
        Object.assign(payload, { name });
        const response = await request(app.getHttpServer()).post(robotsUrl).send(payload);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          message: getErrorMessages(name, 'name', 'string'),
        });
      });
    });

    describe('tasks', () => {
      const tasksUrl = `${robotsUrl}/1/tasks`;
      let payload: CreateTasksDto;

      beforeEach(() => {
        payload = new CreateTasksDto();

        const task = Object.assign(new CreateTaskDto(), {
          name: faker.name.firstName(),
          priority: faker.random.arrayElement([Priority.HIGH, Priority.MEDIUM, Priority.LOW]),
          taskTimeSeconds: faker.datatype.number({ min: 0, max: 3600 }),
          updatedBy: faker.name.firstName(),
        });

        payload.tasks.push(task);
      });

      it('should create a new task for a robot', async () => {
        const response = await request(app.getHttpServer()).post(tasksUrl).send(payload);

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          id: 1,
          name: 'Moxie',
          taskQueue: [
            {
              ...payload.tasks[0],
              robot: {
                id: 1,
              },
            },
          ],
        });
      });

      it('should return a 400 if no payload is provided', async () => {
        const response = await request(app.getHttpServer()).post(tasksUrl).send();

        expect(response.status).toBe(400);
      });

      it('should return a 400 if an empty payload is provided', async () => {
        const response = await request(app.getHttpServer()).post(tasksUrl).send([]);

        expect(response.status).toBe(400);
      });

      it.each([null, undefined, '', true, 1])('should return a 400 if name is %s', async (name) => {
        Object.assign(payload.tasks[0], { name });
        const response = await request(app.getHttpServer()).post(tasksUrl).send(payload);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          message: getErrorMessages(name, 'tasks.0.name', 'string'),
        });
      });

      it.each([null, undefined, '', 'foo', true, 1])('should return a 400 if priority is %s', async (priority) => {
        Object.assign(payload.tasks[0], { priority });
        const response = await request(app.getHttpServer()).post(tasksUrl).send(payload);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          message: getErrorMessages(priority, 'tasks.0.priority', 'enum'),
        });
      });

      it.each([null, undefined, '', 'foo', true])(
        'should return a 400 if taskTimeSeconds is %s',
        async (taskTimeSeconds) => {
          Object.assign(payload.tasks[0], { taskTimeSeconds });
          const response = await request(app.getHttpServer()).post(tasksUrl).send(payload);

          const errorMessages = getErrorMessages(taskTimeSeconds, 'tasks.0.taskTimeSeconds', 'int');
          errorMessages.push('tasks.0.taskTimeSeconds must not be greater than 3600');
          errorMessages.push('tasks.0.taskTimeSeconds must not be less than 0');

          expect(response.status).toBe(400);
          expect(response.body).toMatchObject({
            message: expect.arrayContaining(errorMessages),
          });
        },
      );

      it.each([-1, 3601])('should return a 400 if taskTimeSeconds is %s', async (taskTimeSeconds) => {
        Object.assign(payload.tasks[0], { taskTimeSeconds });
        const response = await request(app.getHttpServer()).post(tasksUrl).send(payload);

        const errorMessages: string[] = [];
        if (typeof taskTimeSeconds === 'number' && taskTimeSeconds < 0) {
          errorMessages.push('tasks.0.taskTimeSeconds must not be less than 0');
        }

        if (typeof taskTimeSeconds === 'number' && taskTimeSeconds > 3600) {
          errorMessages.push('tasks.0.taskTimeSeconds must not be greater than 3600');
        }

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          message: errorMessages,
        });
      });

      it.each([null, undefined, '', true, 1])('should return a 400 if updatedBy is %s', async (updatedBy) => {
        Object.assign(payload.tasks[0], { updatedBy });
        const response = await request(app.getHttpServer()).post(tasksUrl).send(payload);

        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          message: getErrorMessages(updatedBy, 'tasks.0.updatedBy', 'string'),
        });
      });
    });
  });
});
