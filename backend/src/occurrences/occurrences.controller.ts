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
import { OccurrencesService } from './occurrences.service';
import { CreateOccurrenceDto } from './dto/create-occurrence.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('leads/:leadId/occurrences')
@UseGuards(JwtAuthGuard)
export class OccurrencesController {
  constructor(private readonly occurrencesService: OccurrencesService) {}

  /**
   * Lista todas as ocorrências de um lead
   */
  @Get()
  findAll(@Param('leadId', ParseIntPipe) leadId: number, @Request() req) {
    return this.occurrencesService.findAllByLead(leadId, req.user);
  }

  /**
   * Cria uma nova ocorrência
   */
  @Post()
  create(
    @Param('leadId', ParseIntPipe) leadId: number,
    @Body() createOccurrenceDto: CreateOccurrenceDto,
    @Request() req,
  ) {
    return this.occurrencesService.create(leadId, createOccurrenceDto, req.user);
  }

  /**
   * Remove uma ocorrência
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.occurrencesService.remove(id, req.user);
  }
}









