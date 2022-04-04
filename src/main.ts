import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './config/app.config';
import { buildSwaggerOptions } from './config/swagger.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  await configureApp(app);

  const document = SwaggerModule.createDocument(app, buildSwaggerOptions());
  SwaggerModule.setup('api-doc', app, document);

  await app.listen(3000);
}
bootstrap().catch((e) => {
  console.error(e);
});
