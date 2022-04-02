import { INestApplication } from '@nestjs/common';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { AppModule } from '@src/app.module';
import { configureApp } from '@src/config/app.config';

export const bootstrapTestApp = async (): Promise<INestApplication> => {
  const testingModule: TestingModuleBuilder = Test.createTestingModule({
    imports: [AppModule],
  });

  const moduleFixture = await testingModule.compile();
  const app = moduleFixture.createNestApplication();

  await configureApp(app);
  await app.init();

  return app;
};
