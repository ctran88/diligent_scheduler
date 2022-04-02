import { Body, Controller, Post } from '@nestjs/common';
import { TaskService } from '@src/task/task.service';
import { ReceiveTaskEventDto } from './dto/receive-task-event.dto';

@Controller('webhooks')
export class WebhookController {
  public constructor(private readonly taskService: TaskService) {}

  @Post('tasks')
  public async receieveTaskEvent(@Body() body: ReceiveTaskEventDto): Promise<void> {
    await this.taskService.updateTaskStatus(body.taskId, body.status);
  }
}
