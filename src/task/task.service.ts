import { EntityRepository, QueryOrder } from '@mikro-orm/core';
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

  public async setNextActiveTask(robotId: number): Promise<TaskEntity | null> {
    const task = await this.repo.findOne(
      {
        $and: [{ robot: { id: robotId } }, { status: Status.QUEUED }],
      },
      {
        orderBy: [{ priority: QueryOrder.ASC }, { taskTimeSeconds: QueryOrder.ASC }],
      },
    );

    if (!task) {
      return null;
    }

    await this.updateTaskStatus(task.id, Status.ACTIVE);
    return task;
  }
}
