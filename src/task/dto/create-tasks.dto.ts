import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateTaskDto } from './create-task.dto';

export class CreateTasksDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested()
  @Type(() => CreateTaskDto)
  @ApiProperty({ type: CreateTaskDto, isArray: true })
  public readonly tasks: CreateTaskDto[] = [];
}
