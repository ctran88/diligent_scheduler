import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TaskModule } from '@src/task/task.module';
import { WebhookController } from './webhook.controller';

@Module({
  imports: [EventEmitterModule.forRoot(), TaskModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
