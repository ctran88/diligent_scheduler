import { PickType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { RobotEntity } from '../robot.entity';

export class CreateRobotDto extends PickType(RobotEntity, ['name']) {
  @IsString()
  @IsNotEmpty()
  public readonly name: string;
}
