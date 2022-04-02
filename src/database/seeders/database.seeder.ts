import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { RobotEntity } from '@src/robot/robot.entity';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    em.create(RobotEntity, {
      name: 'Moxie',
    });
  }
}
