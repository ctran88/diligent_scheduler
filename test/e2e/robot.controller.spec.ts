import { EntityManager } from '@mikro-orm/core';
import { faker } from '@mikro-orm/seeder';
import { INestApplication } from '@nestjs/common';
import { RobotEntity } from '@src/robot/robot.entity';
import { Priority, Status, TaskEntity } from '@src/task/task.entity';
import { RobotFactory } from '@test/factories/robot.factory';
import { TaskFactory } from '@test/factories/task.factory';
import { bootstrapTestApp } from '@test/utils/bootstrap-test-app';
import request from 'supertest';

describe('RobotController e2e', () => {
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
    describe('all', () => {
      it('should retrieve the default robot', async () => {
        const response = await request(app.getHttpServer()).get('/v1/robots');

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

        const response = await request(app.getHttpServer()).get('/v1/robots');

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
      it('should retrieve the correct robot by id', async () => {
        const response = await request(app.getHttpServer()).get('/v1/robots/1');

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          id: 1,
          name: 'Moxie',
        });
      });

      it('should return the correct active task', async () => {
        const robot = await em.findOneOrFail(RobotEntity, { id: 1 });
        const task = await taskFactory.createOne({ robot, status: Status.ACTIVE });

        robot.tasks.add(task);
        await em.persistAndFlush(robot);

        const response = await request(app.getHttpServer()).get('/v1/robots/1');

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

      it('should return the correct queued tasks', async () => {
        const robot = await em.findOneOrFail(RobotEntity, { id: 1 });
        const task = await taskFactory.createOne({ robot, status: Status.QUEUED });

        robot.tasks.add(task);
        await em.persistAndFlush(robot);

        const response = await request(app.getHttpServer()).get('/v1/robots/1');

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

      it('should return the correct historical tasks', async () => {
        const robot = await em.findOneOrFail(RobotEntity, { id: 1 });
        const taskCompleted = await taskFactory.createOne({ robot, status: Status.COMPLETED });
        const taskAbandoned = await taskFactory.createOne({ robot, status: Status.ABANDONED });

        robot.tasks.add(taskCompleted, taskAbandoned);
        await em.persistAndFlush(robot);

        const response = await request(app.getHttpServer()).get('/v1/robots/1');

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

        const response = await request(app.getHttpServer()).get('/v1/robots/1');

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
    describe('robots', () => {
      it('should create a new robot', async () => {
        const payload = { name: faker.name.firstName() };
        const response = await request(app.getHttpServer()).post('/v1/robots').send(payload);

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject(payload);
      });
    });

    describe('tasks', () => {
      it('should create a new task for a robot', async () => {
        const payload = {
          name: faker.name.firstName(),
          priority: Priority.MEDIUM,
          taskTimeSeconds: faker.datatype.number(),
          updatedBy: faker.name.firstName(),
        };
        const response = await request(app.getHttpServer()).post('/v1/robots/1/tasks').send(payload);

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
          id: 1,
          name: 'Moxie',
          taskQueue: [
            {
              ...payload,
              robot: {
                id: 1,
              },
            },
          ],
        });
      });
    });
  });
});
