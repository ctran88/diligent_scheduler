import { BetterSqliteDriver } from '@mikro-orm/better-sqlite';
import { MikroORM } from '@mikro-orm/core';
import { MikroOrmModuleSyncOptions } from '@mikro-orm/nestjs';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { DatabaseSeeder } from '@src/database/seeders/database.seeder';

const options: MikroOrmModuleSyncOptions = {
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  driver: BetterSqliteDriver,
  metadataProvider: TsMorphMetadataProvider,
  debug: true,
  migrations: {
    path: 'dist/src/database/migrations',
    pathTs: 'src/database/migrations',
    fileName: (time) => `${time}-migration`,
    disableForeignKeys: false,
  },
  discovery: {
    warnWhenNoEntities: false,
  },
  seeder: {
    path: 'dist/src/database/seeders',
    pathTs: 'src/database/seeders',
  },
};

export default options;

export async function ensureDatabase(orm: MikroORM): Promise<void> {
  const generator = orm.getSchemaGenerator();
  await generator.refreshDatabase();

  const seeder = orm.getSeeder();
  await seeder.seed(DatabaseSeeder);
}
