import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
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
}
