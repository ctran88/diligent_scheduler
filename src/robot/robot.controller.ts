import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateRobotDto } from './dtos/create-robot.dto';
import { RobotDto } from './dtos/robot.dto';
import { RobotService } from './robot.service';

@Controller('robots')
export class RobotController {
  public constructor(private readonly robotService: RobotService) {}

  @Get()
  public async getAll(): Promise<RobotDto[]> {
    const entities = await this.robotService.findAll();
    return entities.map((i) => RobotDto.fromEntity(i));
  }

  @Get(':id')
  public async getById(@Param() id: number): Promise<RobotDto> {
    const entity = await this.robotService.findById(id);
    return RobotDto.fromEntity(entity);
  }

  @Post()
  public async post(@Body() body: CreateRobotDto): Promise<RobotDto> {
    const entity = await this.robotService.create(body);
    return RobotDto.fromEntity(entity);
  }
}
