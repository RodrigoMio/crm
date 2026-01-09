import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { LeadActivitiesService } from './lead-activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('leads/:leadId/activities')
@UseGuards(JwtAuthGuard)
export class LeadActivitiesController {
  constructor(private readonly leadActivitiesService: LeadActivitiesService) {}

  /**
   * Lista todas as atividades ativas de um lead
   */
  @Get()
  findAll(@Param('leadId', ParseIntPipe) leadId: number, @Request() req) {
    return this.leadActivitiesService.findAllByLead(leadId, req.user);
  }

  /**
   * Cria uma nova atividade
   */
  @Post()
  create(
    @Param('leadId', ParseIntPipe) leadId: number,
    @Body() createActivityDto: CreateActivityDto,
    @Request() req,
  ) {
    return this.leadActivitiesService.create(leadId, createActivityDto, req.user);
  }

  /**
   * Remove uma atividade (soft delete)
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.leadActivitiesService.remove(id, req.user);
  }
}

