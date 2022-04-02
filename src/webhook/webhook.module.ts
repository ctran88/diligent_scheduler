import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WebhookController } from './webhook.controller';

@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [WebhookController],
})
export class WebhookModule {}
