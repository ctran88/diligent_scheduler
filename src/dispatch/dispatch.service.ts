import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TaskService } from '@src/task/task.service';
import { ReceiveTaskEvent } from '@src/webhook/models/receive-task-event';

@Injectable()
export class DispatchService {
  public constructor(private readonly taskService: TaskService, private readonly httpService: HttpService) {}

  @OnEvent('task.finished')
  public async dispatchNextTask(event: ReceiveTaskEvent): Promise<void> {
    await this.taskService.updateTaskStatus(event.taskId, event.status);
    const nextActiveTask = await this.taskService.setNextActiveTask(event.robotId);

    this.httpService.post('robot-webhook-url', nextActiveTask);
  }
}
