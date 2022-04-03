import { Factory, Faker } from '@mikro-orm/seeder';
import { Status, TaskEntity } from '@src/task/task.entity';

export class TaskFactory extends Factory<TaskEntity> {
  public model = TaskEntity;

  public definition(faker: Faker): Partial<TaskEntity> {
    return {
      id: faker.datatype.number(),
      name: faker.name.firstName(),
      status: faker.random.arrayElement([Status.ABANDONED, Status.ACTIVE, Status.COMPLETED, Status.QUEUED]),
      taskTimeSeconds: faker.datatype.number(),
      createdAt: faker.datatype.datetime(),
      updatedAt: faker.datatype.datetime(),
      updatedBy: faker.name.firstName(),
    };
  }
}
