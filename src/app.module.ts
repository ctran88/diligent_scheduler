import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { RobotModule } from './robot/robot.module';

@Module({
  imports: [MikroOrmModule.forRoot(), RobotModule],
})
export class AppModule {}
