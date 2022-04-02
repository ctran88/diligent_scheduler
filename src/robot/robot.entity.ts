import { Entity, PrimaryKey, Property, OneToMany, Collection } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { TaskEntity } from 'src/task/task.entity';

@Entity({ tableName: 'robots' })
export class RobotEntity {
  @ApiProperty()
  @PrimaryKey()
  public id: number;

  @ApiProperty()
  @Property()
  public name!: string;

  @ApiProperty()
  @OneToMany({ mappedBy: 'robot' })
  public tasks = new Collection<TaskEntity>(this);
}
