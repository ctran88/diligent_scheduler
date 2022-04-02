import { Entity, PrimaryKey, Property, OneToMany, Collection } from '@mikro-orm/core';
import { TaskEntity } from 'src/task/task.entity';

@Entity({ tableName: 'robots' })
export class RobotEntity {
  @PrimaryKey()
  public id: number;

  @Property()
  public name!: string;

  @OneToMany({ mappedBy: 'robot' })
  public tasks = new Collection<TaskEntity>(this);
}
