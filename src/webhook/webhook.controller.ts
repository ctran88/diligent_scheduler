import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ReceiveTaskEventDto } from './dto/receive-task-event.dto';

@Controller('webhooks')
export class WebhookController {
  public constructor(private readonly eventEmitter: EventEmitter2) {}

  @Post('tasks')
  @HttpCode(200)
  public receieveTaskEvent(@Body() body: ReceiveTaskEventDto): void {
    this.eventEmitter.emit('task.finished', body);
  }
}
