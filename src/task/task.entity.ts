import { Entity, PrimaryKey, ManyToOne, Property } from '@mikro-orm/core';
import { RobotEntity } from 'src/robot/robot.entity';

@Entity({ tableName: 'tasks' })
export class TaskEntity {
  @PrimaryKey()
  public id: number;

  @ManyToOne()
  public robot: RobotEntity;

  @Property()
  public priority: TaskPriority;

  @Property()
  public taskTimeSeconds: number;

  @Property()
  public status: Status;

  @Property({ onCreate: () => new Date() })
  public createdAt: Date;

  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  public updatedAt: Date;

  @Property()
  public updatedBy: string;
}

export enum TaskPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum Status {
  QUEUED = 'QUEUED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}
