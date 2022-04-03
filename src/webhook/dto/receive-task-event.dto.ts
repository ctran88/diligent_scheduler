import { ApiProperty } from '@nestjs/swagger';
import { Status } from '@src/task/task.entity';
import { IsEnum, IsIn, IsInt, IsNotEmpty } from 'class-validator';

export class ReceiveTaskEventDto {
  @IsInt()
  @IsNotEmpty()
  @ApiProperty()
  public readonly robotId: number;

  @IsInt()
  @IsNotEmpty()
  @ApiProperty()
  public readonly taskId: number;

  @IsEnum(Status)
  @IsIn([Status.ABANDONED, Status.COMPLETED])
  @IsNotEmpty()
  @ApiProperty()
  public readonly status: Status;
}
