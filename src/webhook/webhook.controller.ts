import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaskService } from '@src/task/task.service';
import { ReceiveTaskEventDto } from './dto/receive-task-event.dto';

@Controller('webhooks')
export class WebhookController {
  public constructor(private readonly taskService: TaskService, private readonly eventEmitter: EventEmitter2) {}

  @Post('tasks')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async receieveTaskEvent(@Body() body: ReceiveTaskEventDto): Promise<void> {
    await this.taskService.updateTaskStatus(body.taskId, body.status);
    this.eventEmitter.emit('task.finished', body);
  }
}
