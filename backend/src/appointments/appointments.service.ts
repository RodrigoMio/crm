import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { FilterAppointmentsDto } from './dto/filter-appointments.dto';
import { CompleteAppointmentDto } from './dto/complete-appointment.dto';
import { Lead } from '../leads/entities/lead.entity';
import { User, UserProfile } from '../users/entities/user.entity';
import { LeadsService } from '../leads/leads.service';
import { Occurrence, OccurrenceType } from '../occurrences/entities/occurrence.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
    @InjectRepository(Occurrence)
    private occurrencesRepository: Repository<Occurrence>,
    private leadsService: LeadsService,
  ) {}

  /**
   * Normaliza ID para number
   */
  private normalizeId(id: any): number {
    if (typeof id === 'string') {
      return parseInt(id, 10);
    }
    return Number(id);
  }

  /**
   * Valida se a data é hoje ou futura (considera data e hora)
   */
  private validateDate(dataAgendamento: Date): void {
    const agora = new Date();
    
    if (dataAgendamento < agora) {
      throw new BadRequestException('A data e hora do agendamento deve ser hoje ou uma data/hora futura');
    }
  }

  /**
   * Busca o agendamento SCHEDULED de um lead
   */
  async findScheduledByLead(leadId: number, currentUser: User): Promise<Appointment | null> {
    // Verifica se o usuário tem acesso ao lead
    await this.leadsService.findOne(leadId, currentUser);

    const appointment = await this.appointmentsRepository.findOne({
      where: {
        lead_id: leadId,
        status: AppointmentStatus.SCHEDULED,
      },
      relations: ['usuario'],
      order: { data_agendamento: 'DESC' },
    });

    return appointment;
  }

  /**
   * Busca todos os agendamentos de um lead (histórico completo)
   */
  async findAllByLead(leadId: number, currentUser: User): Promise<Appointment[]> {
    // Verifica se o usuário tem acesso ao lead
    await this.leadsService.findOne(leadId, currentUser);

    const appointments = await this.appointmentsRepository.find({
      where: { lead_id: leadId },
      relations: ['usuario'],
      order: { data_agendamento: 'DESC' },
    });

    return appointments;
  }

  /**
   * Busca agendamento por ID
   */
  async findOne(id: number, currentUser: User): Promise<Appointment> {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['lead', 'usuario'],
    });

    if (!appointment) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    // Verifica se o usuário tem acesso ao lead
    await this.leadsService.findOne(appointment.lead_id, currentUser);

    return appointment;
  }

  /**
   * Cria um novo agendamento
   * Se já existir um agendamento SCHEDULED, cancela o anterior
   */
  async create(
    leadId: number,
    createAppointmentDto: CreateAppointmentDto,
    currentUser: User,
  ): Promise<Appointment> {
    // Verifica se o usuário tem acesso ao lead e busca o lead completo
    const lead = await this.leadsService.findOne(leadId, currentUser);

    // Valida se o lead tem vendedor_id e usuario_id_colaborador definidos
    if (!lead.vendedor_id) {
      throw new BadRequestException('Permitido agendamento somente com Agente e Colaborador definidos');
    }

    if (!lead.usuario_id_colaborador) {
      throw new BadRequestException('Permitido agendamento somente com Agente e Colaborador definidos');
    }

    const dataAgendamento = new Date(createAppointmentDto.data_agendamento);
    this.validateDate(dataAgendamento);

    // Cancela agendamento SCHEDULED existente, se houver
    const existingScheduled = await this.appointmentsRepository.findOne({
      where: {
        lead_id: leadId,
        status: AppointmentStatus.SCHEDULED,
      },
    });

    if (existingScheduled) {
      existingScheduled.status = AppointmentStatus.CANCELLED;
      await this.appointmentsRepository.save(existingScheduled);
    }

    // Usa usuario_id_colaborador do lead ao invés do usuário logado
    const userId = this.normalizeId(lead.usuario_id_colaborador);

    const appointment = this.appointmentsRepository.create({
      lead_id: leadId,
      usuario_id: userId,
      data_agendamento: dataAgendamento,
      status: AppointmentStatus.SCHEDULED,
      observacoes: createAppointmentDto.observacoes?.trim() || null,
    });

    return await this.appointmentsRepository.save(appointment);
  }

  /**
   * Reagenda um agendamento
   * Cancela o agendamento atual e cria um novo com a nova data
   */
  async reschedule(
    id: number,
    rescheduleDto: RescheduleAppointmentDto,
    currentUser: User,
  ): Promise<Appointment> {
    const existingAppointment = await this.findOne(id, currentUser);

    if (existingAppointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Apenas agendamentos com status SCHEDULED podem ser reagendados');
    }

    // Busca o lead completo para validar vendedor_id e usuario_id_colaborador
    const lead = await this.leadsService.findOne(existingAppointment.lead_id, currentUser);

    // Valida se o lead tem vendedor_id e usuario_id_colaborador definidos
    if (!lead.vendedor_id) {
      throw new BadRequestException('Permitido agendamento somente com Agente e Colaborador definidos');
    }

    if (!lead.usuario_id_colaborador) {
      throw new BadRequestException('Permitido agendamento somente com Agente e Colaborador definidos');
    }

    const novaData = new Date(rescheduleDto.data_agendamento);
    this.validateDate(novaData);

    // Cancela o agendamento atual
    existingAppointment.status = AppointmentStatus.CANCELLED;
    await this.appointmentsRepository.save(existingAppointment);

    // Usa usuario_id_colaborador do lead ao invés do usuário logado
    const userId = this.normalizeId(lead.usuario_id_colaborador);

    const newAppointment = this.appointmentsRepository.create({
      lead_id: existingAppointment.lead_id,
      usuario_id: userId,
      data_agendamento: novaData,
      status: AppointmentStatus.SCHEDULED,
      observacoes: existingAppointment.observacoes,
    });

    return await this.appointmentsRepository.save(newAppointment);
  }

  /**
   * Cancela um agendamento
   */
  async cancel(id: number, currentUser: User): Promise<Appointment> {
    const appointment = await this.findOne(id, currentUser);

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Apenas agendamentos com status SCHEDULED podem ser cancelados');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    return await this.appointmentsRepository.save(appointment);
  }

  /**
   * Marca agendamento como realizado
   * Se observações forem fornecidas, cria uma ocorrência do tipo USUARIO
   */
  async complete(id: number, completeDto: CompleteAppointmentDto, currentUser: User): Promise<Appointment> {
    const appointment = await this.findOne(id, currentUser);

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Apenas agendamentos com status SCHEDULED podem ser marcados como realizados');
    }

    appointment.status = AppointmentStatus.COMPLETED;
    const savedAppointment = await this.appointmentsRepository.save(appointment);

    // Se houver observações, cria uma ocorrência do tipo USUARIO
    if (completeDto.observacoes && completeDto.observacoes.trim()) {
      const userId = this.normalizeId(currentUser.id);
      const occurrence = this.occurrencesRepository.create({
        leads_id: appointment.lead_id,
        usuarios_id: userId,
        texto: completeDto.observacoes.trim(),
        tipo: OccurrenceType.USUARIO,
      });
      await this.occurrencesRepository.save(occurrence);
    }

    return savedAppointment;
  }

  /**
   * Marca agendamento como não realizado (no-show)
   */
  async markNoShow(id: number, currentUser: User): Promise<Appointment> {
    const appointment = await this.findOne(id, currentUser);

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Apenas agendamentos com status SCHEDULED podem ser marcados como não realizados');
    }

    appointment.status = AppointmentStatus.NO_SHOW;
    return await this.appointmentsRepository.save(appointment);
  }

  /**
   * Busca agendamentos com filtros (período, status, vendedor, colaborador)
   * Aplica filtros de permissão baseado no perfil do usuário
   */
  async findAll(
    filterDto: FilterAppointmentsDto,
    currentUser: User,
  ): Promise<Appointment[]> {
    const queryBuilder = this.appointmentsRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.lead', 'lead')
      .leftJoinAndSelect('appointment.usuario', 'usuario')
      .leftJoinAndSelect('lead.vendedor', 'vendedor')
      .leftJoinAndSelect('lead.colaborador', 'colaborador')
      .leftJoinAndSelect('lead.kanbanStatus', 'kanbanStatus');

    // Filtros de período
    if (filterDto.startDate) {
      queryBuilder.andWhere('appointment.data_agendamento >= :startDate', {
        startDate: filterDto.startDate,
      });
    }

    if (filterDto.endDate) {
      // Adiciona 1 dia e subtrai 1 segundo para incluir o dia inteiro
      const endDate = new Date(filterDto.endDate);
      endDate.setDate(endDate.getDate() + 1);
      endDate.setSeconds(endDate.getSeconds() - 1);
      queryBuilder.andWhere('appointment.data_agendamento <= :endDate', {
        endDate: endDate.toISOString(),
      });
    }

    // Filtro por status
    if (filterDto.status) {
      queryBuilder.andWhere('appointment.status = :status', {
        status: filterDto.status,
      });
    }

    // Aplicar filtros de permissão baseado no perfil
    const currentUserId = this.normalizeId(currentUser.id);

    if (currentUser.perfil === UserProfile.ADMIN) {
      // Admin vê todos, mas pode filtrar por vendedor ou colaborador
      if (filterDto.vendedor_id) {
        queryBuilder.andWhere('lead.vendedor_id = :vendedorId', {
          vendedorId: filterDto.vendedor_id,
        });
      }

      if (filterDto.colaborador_id) {
        queryBuilder.andWhere('lead.usuario_id_colaborador = :colaboradorId', {
          colaboradorId: filterDto.colaborador_id,
        });
      }
    } else if (currentUser.perfil === UserProfile.AGENTE) {
      // Agente vê apenas leads com vendedor_id = seu ID
      queryBuilder.andWhere('lead.vendedor_id = :currentUserId', {
        currentUserId,
      });

      // Pode filtrar por colaborador (apenas seus colaboradores)
      if (filterDto.colaborador_id) {
        queryBuilder.andWhere('lead.usuario_id_colaborador = :colaboradorId', {
          colaboradorId: filterDto.colaborador_id,
        });
      }
    } else if (currentUser.perfil === UserProfile.COLABORADOR) {
      // Colaborador vê apenas leads com usuario_id_colaborador = seu ID
      queryBuilder.andWhere('lead.usuario_id_colaborador = :currentUserId', {
        currentUserId,
      });
    }

    queryBuilder.orderBy('appointment.data_agendamento', 'ASC');

    return await queryBuilder.getMany();
  }

  /**
   * Move um agendamento para outra data (drag and drop)
   * Marca o agendamento anterior como NO_SHOW e cria um novo SCHEDULED
   * Permite mover mesmo se a nova data for hoje e a hora já passou
   */
  async move(
    id: number,
    newDate: Date,
    currentUser: User,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id, currentUser);

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Apenas agendamentos com status SCHEDULED podem ser movidos');
    }

    // Valida apenas se a data for passada (não permite datas anteriores a hoje)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const novaData = new Date(newDate);
    novaData.setHours(0, 0, 0, 0);

    if (novaData < hoje) {
      throw new BadRequestException('Não é possível mover para uma data passada');
    }

    // Mantém a hora original, apenas altera a data
    const originalDate = new Date(appointment.data_agendamento);
    const newDateTime = new Date(newDate);
    newDateTime.setHours(
      originalDate.getHours(),
      originalDate.getMinutes(),
      originalDate.getSeconds(),
      originalDate.getMilliseconds(),
    );

    // Busca o lead completo para validar vendedor_id e usuario_id_colaborador
    const lead = await this.leadsService.findOne(appointment.lead_id, currentUser);

    // Valida se o lead tem vendedor_id e usuario_id_colaborador definidos
    if (!lead.vendedor_id) {
      throw new BadRequestException('Permitido agendamento somente com Agente e Colaborador definidos');
    }

    if (!lead.usuario_id_colaborador) {
      throw new BadRequestException('Permitido agendamento somente com Agente e Colaborador definidos');
    }

    // Marca o agendamento atual como NO_SHOW
    appointment.status = AppointmentStatus.NO_SHOW;
    await this.appointmentsRepository.save(appointment);

    // Usa usuario_id_colaborador do lead ao invés do usuário logado
    const userId = this.normalizeId(lead.usuario_id_colaborador);

    const newAppointment = this.appointmentsRepository.create({
      lead_id: appointment.lead_id,
      usuario_id: userId,
      data_agendamento: newDateTime,
      status: AppointmentStatus.SCHEDULED,
      observacoes: appointment.observacoes,
    });

    return await this.appointmentsRepository.save(newAppointment);
  }
}

