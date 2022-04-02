import { MikroORM } from '@mikro-orm/core';
import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ensureDatabase } from './config/mikro-orm.config';
import { buildSwaggerOptions } from './config/swagger.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const orm = app.get<MikroORM>(MikroORM);
  await ensureDatabase(orm);

  const document = SwaggerModule.createDocument(app, buildSwaggerOptions());
  SwaggerModule.setup('api-doc', app, document);

  await app.listen(3000);
}
bootstrap().catch((e) => {
  console.log(e);
});
