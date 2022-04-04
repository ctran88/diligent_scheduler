import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TaskService } from '@src/task/task.service';
import { ReceiveTaskEventDto } from '@src/webhook/dto/receive-task-event.dto';

@Injectable()
export class DispatchService {
  private readonly logger = new Logger();

  public constructor(private readonly taskService: TaskService, private readonly httpService: HttpService) {}

  @OnEvent('task.finished')
  public async dispatchNextTask(event: ReceiveTaskEventDto): Promise<void> {
    const nextActiveTask = await this.taskService.setNextActiveTask(event.robotId);

    if (nextActiveTask) {
      this.logger.log(
        `Dispatching the next task to robot ${nextActiveTask.robot.id}: ${JSON.stringify(nextActiveTask)}`,
      );
      // this.httpService.post('robot-webhook-url', nextActiveTask);
    } else {
      this.logger.log('No other tasks in the queue');
    }
  }
}
