import { PickType } from '@nestjs/swagger';
import { RobotEntity } from '../robot.entity';

export class CreateRobotDto extends PickType(RobotEntity, ['name'] as const) {}
