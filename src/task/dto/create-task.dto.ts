import { PickType } from '@nestjs/swagger';
import { TaskEntity } from '../task.entity';

export class CreateTaskDto extends PickType(TaskEntity, ['priority', 'taskTimeSeconds', 'updatedBy'] as const) {}