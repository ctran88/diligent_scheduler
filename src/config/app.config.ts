import { MikroORM } from '@mikro-orm/core';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { ensureDatabase } from './mikro-orm.config';

export async function configureApp(app: INestApplication): Promise<void> {
  app.useGlobalPipes(new ValidationPipe());
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  const orm = app.get<MikroORM>(MikroORM);
  await ensureDatabase(orm);
}
