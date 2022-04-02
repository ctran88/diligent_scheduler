import { Factory, Faker } from '@mikro-orm/seeder';
import { RobotEntity } from '@src/robot/robot.entity';

export class RobotFactory extends Factory<RobotEntity> {
  public model = RobotEntity;

  public definition(faker: Faker): Partial<RobotEntity> {
    return {
      id: faker.datatype.number(),
      name: faker.name.firstName(),
    };
  }
}
