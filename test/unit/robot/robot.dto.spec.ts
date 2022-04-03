import { RobotDto } from '@src/robot/dtos/robot.dto';
import { RobotEntity } from '@src/robot/robot.entity';
import { Status, TaskEntity } from '@src/task/task.entity';

describe('RobotDto unit tests', () => {
  let entity: RobotEntity;
  let getItemsSpy: jest.SpyInstance<TaskEntity[], [check?: boolean | undefined]>;

  beforeEach(() => {
    entity = new RobotEntity();

    jest.spyOn(entity.tasks, 'init').mockImplementationOnce(jest.fn());

    getItemsSpy = jest.spyOn(entity.tasks, 'getItems');
    getItemsSpy.mockImplementationOnce(() => [
      Object.assign(new TaskEntity(), { status: Status.ABANDONED }),
      Object.assign(new TaskEntity(), { status: Status.ACTIVE }),
      Object.assign(new TaskEntity(), { status: Status.COMPLETED }),
      Object.assign(new TaskEntity(), { status: Status.QUEUED }),
    ]);
  });

  afterAll(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('#fromEntity', () => {
    it('should set activeTask to undefined if none exists', async () => {
      getItemsSpy.mockReset();
      getItemsSpy.mockImplementationOnce(() => [
        Object.assign(new TaskEntity(), { status: Status.ABANDONED }),
        Object.assign(new TaskEntity(), { status: Status.COMPLETED }),
        Object.assign(new TaskEntity(), { status: Status.QUEUED }),
      ]);

      const result = await RobotDto.fromEntity(entity);
      expect(result.activeTask).toBeUndefined();
    });

    it('should map the activeTask property correctly', async () => {
      const result = await RobotDto.fromEntity(entity);
      expect(result.activeTask?.status).toBe(Status.ACTIVE);
    });

    it('should map the taskQueue property correctly', async () => {
      const result = await RobotDto.fromEntity(entity);
      const areAllQueued = result.taskQueue.every((i) => i.status === Status.QUEUED);

      expect(areAllQueued).toBeTruthy();
    });

    it('should map the taskHistory property correctly', async () => {
      const result = await RobotDto.fromEntity(entity);
      const areAllAbandonedOrCompleted = result.taskHistory.every(
        (i) => i.status === Status.ABANDONED || i.status === Status.COMPLETED,
      );

      expect(areAllAbandonedOrCompleted).toBeTruthy();
    });
  });
});
