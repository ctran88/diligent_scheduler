import { INestApplication } from '@nestjs/common';
import { DispatchService } from '@src/dispatch/dispatch.service';
import { ReceiveTaskEventDto } from '@src/webhook/dto/receive-task-event.dto';
import { WebhookController } from '@src/webhook/webhook.controller';
import { bootstrapTestApp } from '@test/utils/bootstrap-test-app';

describe('WebhookController unit tests', () => {
  let app: INestApplication;
  let controller: WebhookController;
  let dispatchService: DispatchService;

  beforeAll(async () => {
    app = await bootstrapTestApp();
    controller = app.get<WebhookController>(WebhookController);
    dispatchService = app.get<DispatchService>(DispatchService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should call DispatchService', () => {
    const dispatchServiceSpy = jest.spyOn(dispatchService, 'dispatchNextTask').mockImplementationOnce(jest.fn());

    controller.receieveTaskEvent(new ReceiveTaskEventDto());

    expect(dispatchServiceSpy).toHaveBeenCalled();
  });
});
