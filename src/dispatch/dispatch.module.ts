import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TaskModule } from '@src/task/task.module';
import { DispatchService } from './dispatch.service';

@Module({
  imports: [TaskModule, HttpModule],
  providers: [DispatchService],
})
export class DispatchModule {}
