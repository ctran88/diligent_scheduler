import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { Status, TaskEntity } from '@src/task/task.entity';

@Injectable()
export class TaskService {
  public constructor(@InjectRepository(TaskEntity) private readonly repo: EntityRepository<TaskEntity>) {}

  public async updateTaskStatus(id: number, status: Status): Promise<void> {
    const task = await this.repo.findOneOrFail(id);
    task.status = status;

    await this.repo.persistAndFlush(task);
  }
}
