import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { CreateTaskDto } from '@src/task/dto/create-task.dto';
import { CreateRobotDto } from './dtos/create-robot.dto';
import { RobotDto } from './dtos/robot.dto';
import { RobotService } from './robot.service';

@Controller('robots')
export class RobotController {
  public constructor(private readonly robotService: RobotService) {}

  @Get()
  public async getAll(): Promise<RobotDto[]> {
    const entities = await this.robotService.findAll();
    return Promise.all(entities.map(async (i) => RobotDto.fromEntity(i)));
  }

  @Get(':id')
  public async getById(@Param('id', ParseIntPipe) id: number): Promise<RobotDto> {
    const entity = await this.robotService.findById(id);
    return RobotDto.fromEntity(entity);
  }

  @Post()
  public async createRobot(@Body() body: CreateRobotDto): Promise<RobotDto> {
    const entity = await this.robotService.create(body);
    return RobotDto.fromEntity(entity);
  }

  @Post(':id/tasks')
  public async createTask(@Param('id', ParseIntPipe) id: number, @Body() body: CreateTaskDto): Promise<RobotDto> {
    const entity = await this.robotService.createTask(id, body);
    return RobotDto.fromEntity(entity);
  }
}
