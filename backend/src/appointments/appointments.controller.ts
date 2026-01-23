import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { FilterAppointmentsDto } from './dto/filter-appointments.dto';
import { MoveAppointmentDto } from './dto/move-appointment.dto';
import { CompleteAppointmentDto } from './dto/complete-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('leads/:leadId/appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   * Busca o agendamento SCHEDULED de um lead
   */
  @Get('scheduled')
  findScheduled(@Param('leadId', ParseIntPipe) leadId: number, @Request() req) {
    return this.appointmentsService.findScheduledByLead(leadId, req.user);
  }

  /**
   * Busca todos os agendamentos de um lead (histórico completo)
   */
  @Get()
  findAll(@Param('leadId', ParseIntPipe) leadId: number, @Request() req) {
    return this.appointmentsService.findAllByLead(leadId, req.user);
  }

  /**
   * Cria um novo agendamento
   */
  @Post()
  create(
    @Param('leadId', ParseIntPipe) leadId: number,
    @Body() createAppointmentDto: CreateAppointmentDto,
    @Request() req,
  ) {
    return this.appointmentsService.create(leadId, createAppointmentDto, req.user);
  }
}

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsControllerById {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  /**
   * Busca agendamento por ID
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.appointmentsService.findOne(id, req.user);
  }

  /**
   * Reagenda um agendamento
   */
  @Patch(':id/reschedule')
  reschedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() rescheduleDto: RescheduleAppointmentDto,
    @Request() req,
  ) {
    return this.appointmentsService.reschedule(id, rescheduleDto, req.user);
  }

  /**
   * Cancela um agendamento
   */
  @Patch(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.appointmentsService.cancel(id, req.user);
  }

  /**
   * Marca agendamento como realizado
   */
  @Patch(':id/complete')
  complete(
    @Param('id', ParseIntPipe) id: number,
    @Body() completeDto: CompleteAppointmentDto,
    @Request() req,
  ) {
    return this.appointmentsService.complete(id, completeDto, req.user);
  }

  /**
   * Marca agendamento como não realizado (no-show)
   */
  @Patch(':id/no-show')
  markNoShow(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.appointmentsService.markNoShow(id, req.user);
  }

  /**
   * Move um agendamento para outra data (drag and drop)
   */
  @Patch(':id/move')
  move(
    @Param('id', ParseIntPipe) id: number,
    @Body() moveDto: MoveAppointmentDto,
    @Request() req,
  ) {
    return this.appointmentsService.move(id, new Date(moveDto.newDate), req.user);
  }

  /**
   * Busca agendamentos com filtros (período, status, vendedor, colaborador)
   */
  @Get()
  findAll(@Query() filterDto: FilterAppointmentsDto, @Request() req) {
    return this.appointmentsService.findAll(filterDto, req.user);
  }
}

