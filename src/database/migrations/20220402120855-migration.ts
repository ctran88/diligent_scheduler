import { Migration } from '@mikro-orm/migrations';

export class Migration20220402120855 extends Migration {
  async up(): Promise<void> {
    this.addSql('create table `robots` (`id` integer not null primary key autoincrement, `name` text not null);');

    this.addSql(
      "create table `tasks` (`id` integer not null primary key autoincrement, `robot_id` integer not null, `priority` text check (`priority` in ('HIGH', 'MEDIUM', 'LOW')) not null default 'LOW', `task_time_seconds` integer not null, `status` text check (`status` in ('QUEUED', 'ACTIVE', 'COMPLETED', 'ABANDONED')) not null, `created_at` datetime not null, `updated_at` datetime not null, `updated_by` text not null, constraint `tasks_robot_id_foreign` foreign key(`robot_id`) references `robots`(`id`) on update cascade);",
    );
    this.addSql('create index `tasks_robot_id_index` on `tasks` (`robot_id`);');
  }
}
