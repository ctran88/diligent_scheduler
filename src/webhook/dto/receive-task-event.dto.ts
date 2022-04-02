import { Status } from '@src/task/task.entity';

export class ReceiveTaskEventDto {
  public taskId: number;
  public status: Status;
}
