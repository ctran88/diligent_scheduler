import { Body, Controller, Post } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReceiveTaskEvent } from './models/receive-task-event';

@Controller('webhooks')
export class WebhookController {
  public constructor(private readonly eventEmitter: EventEmitter2) {}

  @Post('tasks')
  public receieveTaskEvent(@Body() body: ReceiveTaskEvent): void {
    this.eventEmitter.emit('task.finished', body);
  }
}
