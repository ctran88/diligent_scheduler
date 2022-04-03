import { Entity, PrimaryKey, ManyToOne, Property, Enum } from '@mikro-orm/core';
import { ApiProperty } from '@nestjs/swagger';
import { RobotEntity } from 'src/robot/robot.entity';

export enum Priority {
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

@Entity({ tableName: 'tasks' })
export class TaskEntity {
  @ApiProperty()
  @PrimaryKey()
  public id: number;

  @ApiProperty()
  @ManyToOne()
  public robot: RobotEntity;

  @ApiProperty()
  @Property()
  public name: string;

  @ApiProperty()
  @Enum({
    type: () => Priority,
    customOrder: [Priority.HIGH, Priority.MEDIUM, Priority.LOW],
    default: Priority.LOW,
  })
  public priority: Priority;

  @ApiProperty()
  @Property()
  public taskTimeSeconds: number;

  @ApiProperty()
  @Enum({ onCreate: () => Status.QUEUED, type: () => Status })
  public status: Status;

  @ApiProperty()
  @Property({ onCreate: () => new Date() })
  public createdAt: Date;

  @ApiProperty()
  @Property({ onCreate: () => new Date(), onUpdate: () => new Date() })
  public updatedAt: Date;

  @ApiProperty()
  @Property()
  public updatedBy: string;
}
