import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { DispatchModule } from './dispatch/dispatch.module';
import { RobotModule } from './robot/robot.module';
import { TaskModule } from './task/task.module';
import { WebhookModule } from './webhook/webhook.module';

@Module({
  imports: [MikroOrmModule.forRoot(), RobotModule, TaskModule, DispatchModule, WebhookModule],
})
export class AppModule {}
