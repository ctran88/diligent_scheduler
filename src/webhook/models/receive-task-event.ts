import { Status } from '@src/task/task.entity';

export class ReceiveTaskEvent {
  public robotId: number;
  public taskId: number;
  public status: Status;
}
