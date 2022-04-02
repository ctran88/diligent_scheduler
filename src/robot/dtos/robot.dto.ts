import { PickType } from '@nestjs/swagger';
import { Status, TaskEntity } from 'src/task/task.entity';
import { RobotEntity } from '../robot.entity';

export class RobotDto extends PickType(RobotEntity, ['id', 'name'] as const) {
  public activeTask?: TaskEntity;
  public taskQueue: TaskEntity[];
  public taskHistory: TaskEntity[];

  public static async fromEntity(entity: RobotEntity): Promise<RobotDto> {
    await entity.tasks.init();

    const dto = new RobotDto();
    dto.id = entity.id;
    dto.name = entity.name;

    const tasks = entity.tasks.getItems();
    dto.activeTask = tasks.find((i) => i.status === Status.ACTIVE);
    dto.taskQueue = tasks.filter((i) => i.status === Status.QUEUED);
    dto.taskHistory = tasks.filter((i) => i.status !== Status.ACTIVE && i.status !== Status.QUEUED);

    return dto;
  }
}
