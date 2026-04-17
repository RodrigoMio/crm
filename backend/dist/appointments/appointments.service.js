"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const appointment_entity_1 = require("./entities/appointment.entity");
const lead_entity_1 = require("../leads/entities/lead.entity");
const user_entity_1 = require("../users/entities/user.entity");
const leads_service_1 = require("../leads/leads.service");
const occurrence_entity_1 = require("../occurrences/entities/occurrence.entity");
let AppointmentsService = class AppointmentsService {
    constructor(appointmentsRepository, leadsRepository, occurrencesRepository, leadsService) {
        this.appointmentsRepository = appointmentsRepository;
        this.leadsRepository = leadsRepository;
        this.occurrencesRepository = occurrencesRepository;
        this.leadsService = leadsService;
    }
    normalizeId(id) {
        if (typeof id === 'string') {
            return parseInt(id, 10);
        }
        return Number(id);
    }
    validateDate(dataAgendamento) {
        const agora = new Date();
        if (dataAgendamento < agora) {
            throw new common_1.BadRequestException('A data e hora do agendamento deve ser hoje ou uma data/hora futura');
        }
    }
    async findScheduledByLead(leadId, currentUser) {
        await this.leadsService.findOne(leadId, currentUser);
        const appointment = await this.appointmentsRepository.findOne({
            where: {
                lead_id: leadId,
                status: appointment_entity_1.AppointmentStatus.SCHEDULED,
            },
            relations: ['usuario'],
            order: { data_agendamento: 'DESC' },
        });
        return appointment;
    }
    async findAllByLead(leadId, currentUser) {
        await this.leadsService.findOne(leadId, currentUser);
        const appointments = await this.appointmentsRepository.find({
            where: { lead_id: leadId },
            relations: ['usuario'],
            order: { data_agendamento: 'DESC' },
        });
        return appointments;
    }
    async findOne(id, currentUser) {
        const appointment = await this.appointmentsRepository.findOne({
            where: { id },
            relations: ['lead', 'usuario'],
        });
        if (!appointment) {
            throw new common_1.NotFoundException('Agendamento não encontrado');
        }
        await this.leadsService.findOne(appointment.lead_id, currentUser);
        return appointment;
    }
    async create(leadId, createAppointmentDto, currentUser) {
        const lead = await this.leadsService.findOne(leadId, currentUser);
        if (!lead.vendedor_id) {
            throw new common_1.BadRequestException('Permitido agendamento somente com Agente e Colaborador definidos');
        }
        if (!lead.usuario_id_colaborador) {
            throw new common_1.BadRequestException('Permitido agendamento somente com Agente e Colaborador definidos');
        }
        const dataAgendamento = new Date(createAppointmentDto.data_agendamento);
        this.validateDate(dataAgendamento);
        const existingScheduled = await this.appointmentsRepository.findOne({
            where: {
                lead_id: leadId,
                status: appointment_entity_1.AppointmentStatus.SCHEDULED,
            },
        });
        if (existingScheduled) {
            existingScheduled.status = appointment_entity_1.AppointmentStatus.CANCELLED;
            await this.appointmentsRepository.save(existingScheduled);
        }
        const userId = this.normalizeId(lead.usuario_id_colaborador);
        const appointment = this.appointmentsRepository.create({
            lead_id: leadId,
            usuario_id: userId,
            data_agendamento: dataAgendamento,
            status: appointment_entity_1.AppointmentStatus.SCHEDULED,
            observacoes: createAppointmentDto.observacoes?.trim() || null,
        });
        return await this.appointmentsRepository.save(appointment);
    }
    async reschedule(id, rescheduleDto, currentUser) {
        const existingAppointment = await this.findOne(id, currentUser);
        if (existingAppointment.status !== appointment_entity_1.AppointmentStatus.SCHEDULED) {
            throw new common_1.BadRequestException('Apenas agendamentos com status SCHEDULED podem ser reagendados');
        }
        const lead = await this.leadsService.findOne(existingAppointment.lead_id, currentUser);
        if (!lead.vendedor_id) {
            throw new common_1.BadRequestException('Permitido agendamento somente com Agente e Colaborador definidos');
        }
        if (!lead.usuario_id_colaborador) {
            throw new common_1.BadRequestException('Permitido agendamento somente com Agente e Colaborador definidos');
        }
        const novaData = new Date(rescheduleDto.data_agendamento);
        this.validateDate(novaData);
        existingAppointment.status = appointment_entity_1.AppointmentStatus.CANCELLED;
        await this.appointmentsRepository.save(existingAppointment);
        const userId = this.normalizeId(lead.usuario_id_colaborador);
        const newAppointment = this.appointmentsRepository.create({
            lead_id: existingAppointment.lead_id,
            usuario_id: userId,
            data_agendamento: novaData,
            status: appointment_entity_1.AppointmentStatus.SCHEDULED,
            observacoes: existingAppointment.observacoes,
        });
        return await this.appointmentsRepository.save(newAppointment);
    }
    async cancel(id, currentUser) {
        const appointment = await this.findOne(id, currentUser);
        if (appointment.status !== appointment_entity_1.AppointmentStatus.SCHEDULED) {
            throw new common_1.BadRequestException('Apenas agendamentos com status SCHEDULED podem ser cancelados');
        }
        appointment.status = appointment_entity_1.AppointmentStatus.CANCELLED;
        return await this.appointmentsRepository.save(appointment);
    }
    async complete(id, completeDto, currentUser) {
        const appointment = await this.findOne(id, currentUser);
        if (appointment.status !== appointment_entity_1.AppointmentStatus.SCHEDULED) {
            throw new common_1.BadRequestException('Apenas agendamentos com status SCHEDULED podem ser marcados como realizados');
        }
        appointment.status = appointment_entity_1.AppointmentStatus.COMPLETED;
        const savedAppointment = await this.appointmentsRepository.save(appointment);
        if (completeDto.observacoes && completeDto.observacoes.trim()) {
            const userId = this.normalizeId(currentUser.id);
            const occurrence = this.occurrencesRepository.create({
                leads_id: appointment.lead_id,
                usuarios_id: userId,
                texto: completeDto.observacoes.trim(),
                tipo: occurrence_entity_1.OccurrenceType.USUARIO,
            });
            await this.occurrencesRepository.save(occurrence);
        }
        return savedAppointment;
    }
    async markNoShow(id, currentUser) {
        const appointment = await this.findOne(id, currentUser);
        if (appointment.status !== appointment_entity_1.AppointmentStatus.SCHEDULED) {
            throw new common_1.BadRequestException('Apenas agendamentos com status SCHEDULED podem ser marcados como não realizados');
        }
        appointment.status = appointment_entity_1.AppointmentStatus.NO_SHOW;
        return await this.appointmentsRepository.save(appointment);
    }
    async findAll(filterDto, currentUser) {
        const queryBuilder = this.appointmentsRepository
            .createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.lead', 'lead')
            .leftJoinAndSelect('appointment.usuario', 'usuario')
            .leftJoinAndSelect('lead.vendedor', 'vendedor')
            .leftJoinAndSelect('lead.colaborador', 'colaborador')
            .leftJoinAndSelect('lead.kanbanStatus', 'kanbanStatus');
        if (filterDto.startDate) {
            queryBuilder.andWhere('appointment.data_agendamento >= :startDate', {
                startDate: filterDto.startDate,
            });
        }
        if (filterDto.endDate) {
            const endDate = new Date(filterDto.endDate);
            endDate.setDate(endDate.getDate() + 1);
            endDate.setSeconds(endDate.getSeconds() - 1);
            queryBuilder.andWhere('appointment.data_agendamento <= :endDate', {
                endDate: endDate.toISOString(),
            });
        }
        if (filterDto.status) {
            queryBuilder.andWhere('appointment.status = :status', {
                status: filterDto.status,
            });
        }
        const currentUserId = this.normalizeId(currentUser.id);
        if (currentUser.perfil === user_entity_1.UserProfile.ADMIN) {
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
        }
        else if (currentUser.perfil === user_entity_1.UserProfile.AGENTE) {
            queryBuilder.andWhere('lead.vendedor_id = :currentUserId', {
                currentUserId,
            });
            if (filterDto.colaborador_id) {
                queryBuilder.andWhere('lead.usuario_id_colaborador = :colaboradorId', {
                    colaboradorId: filterDto.colaborador_id,
                });
            }
        }
        else if (currentUser.perfil === user_entity_1.UserProfile.COLABORADOR) {
            queryBuilder.andWhere('lead.usuario_id_colaborador = :currentUserId', {
                currentUserId,
            });
        }
        queryBuilder.orderBy('appointment.data_agendamento', 'ASC');
        return await queryBuilder.getMany();
    }
    async move(id, newDate, currentUser) {
        const appointment = await this.findOne(id, currentUser);
        if (appointment.status !== appointment_entity_1.AppointmentStatus.SCHEDULED) {
            throw new common_1.BadRequestException('Apenas agendamentos com status SCHEDULED podem ser movidos');
        }
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const novaData = new Date(newDate);
        novaData.setHours(0, 0, 0, 0);
        if (novaData < hoje) {
            throw new common_1.BadRequestException('Não é possível mover para uma data passada');
        }
        const originalDate = new Date(appointment.data_agendamento);
        const newDateTime = new Date(newDate);
        newDateTime.setHours(originalDate.getHours(), originalDate.getMinutes(), originalDate.getSeconds(), originalDate.getMilliseconds());
        const lead = await this.leadsService.findOne(appointment.lead_id, currentUser);
        if (!lead.vendedor_id) {
            throw new common_1.BadRequestException('Permitido agendamento somente com Agente e Colaborador definidos');
        }
        if (!lead.usuario_id_colaborador) {
            throw new common_1.BadRequestException('Permitido agendamento somente com Agente e Colaborador definidos');
        }
        appointment.status = appointment_entity_1.AppointmentStatus.NO_SHOW;
        await this.appointmentsRepository.save(appointment);
        const userId = this.normalizeId(lead.usuario_id_colaborador);
        const newAppointment = this.appointmentsRepository.create({
            lead_id: appointment.lead_id,
            usuario_id: userId,
            data_agendamento: newDateTime,
            status: appointment_entity_1.AppointmentStatus.SCHEDULED,
            observacoes: appointment.observacoes,
        });
        return await this.appointmentsRepository.save(newAppointment);
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(appointment_entity_1.Appointment)),
    __param(1, (0, typeorm_1.InjectRepository)(lead_entity_1.Lead)),
    __param(2, (0, typeorm_1.InjectRepository)(occurrence_entity_1.Occurrence)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        leads_service_1.LeadsService])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map