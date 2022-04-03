import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TaskService } from '@src/task/task.service';
import { ReceiveTaskEventDto } from '@src/webhook/dto/receive-task-event.dto';

@Injectable()
export class DispatchService {
  public constructor(private readonly taskService: TaskService, private readonly httpService: HttpService) {}

  @OnEvent('task.finished')
  public async dispatchNextTask(event: ReceiveTaskEventDto): Promise<void> {
    await this.taskService.updateTaskStatus(event.taskId, event.status);
    const nextActiveTask = await this.taskService.setNextActiveTask(event.robotId);

    if (nextActiveTask) {
      this.httpService.post('robot-webhook-url', nextActiveTask);
    }
  }
}
