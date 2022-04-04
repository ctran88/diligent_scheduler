import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { TaskEntity } from '@src/task/task.entity';
import { RobotEntity } from './robot.entity';

@Injectable()
export class RobotService {
  public constructor(@InjectRepository(RobotEntity) private readonly repo: EntityRepository<RobotEntity>) {}

  public async findAll(): Promise<RobotEntity[]> {
    return this.repo.findAll();
  }

  public async findById(id: number): Promise<RobotEntity> {
    return this.repo.findOneOrFail(id);
  }

  public async create(partialRobot: Partial<RobotEntity>): Promise<RobotEntity> {
    const newRobot = Object.assign(new RobotEntity(), partialRobot);
    await this.repo.persistAndFlush(newRobot);

    return newRobot;
  }

  public async createTask(id: number, partialTasks: Partial<TaskEntity>[]): Promise<RobotEntity> {
    const robot = await this.findById(id);
    const newTasks = partialTasks.map((task) => Object.assign(new TaskEntity(), task));

    robot.tasks.add(...newTasks);
    await this.repo.persistAndFlush(robot);

    return robot;
  }
}
