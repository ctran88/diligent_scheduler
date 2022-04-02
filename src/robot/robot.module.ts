import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { RobotController } from './robot.controller';
import { RobotEntity } from './robot.entity';
import { RobotService } from './robot.service';

@Module({
  imports: [MikroOrmModule.forFeature([RobotEntity])],
  controllers: [RobotController],
  providers: [RobotService],
})
export class RobotModule {}
