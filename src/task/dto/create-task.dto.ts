import { PickType } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { Priority, TaskEntity } from '../task.entity';

export class CreateTaskDto extends PickType(TaskEntity, ['name', 'priority', 'taskTimeSeconds', 'updatedBy'] as const) {
  @IsString()
  @IsNotEmpty()
  public readonly name: string;

  @IsEnum(Priority)
  @IsNotEmpty()
  public readonly priority: Priority;

  @IsInt()
  @Min(0)
  @Max(3600) // 1 hour in seconds
  @IsNotEmpty()
  public readonly taskTimeSeconds: number;

  @IsString()
  @IsNotEmpty()
  public readonly updatedBy: string;
}
