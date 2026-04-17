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
exports.LeadActivitiesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const lead_ocorrencia_entity_1 = require("../lead-ocorrencias/entities/lead-ocorrencia.entity");
const leads_service_1 = require("../leads/leads.service");
const user_entity_1 = require("../users/entities/user.entity");
let LeadActivitiesService = class LeadActivitiesService {
    constructor(leadOcorrenciaRepository, leadsService) {
        this.leadOcorrenciaRepository = leadOcorrenciaRepository;
        this.leadsService = leadsService;
    }
    async findAllByLead(leadId, currentUser) {
        try {
            await this.leadsService.findOne(leadId, currentUser);
            const activities = await this.leadOcorrenciaRepository.find({
                where: {
                    leads_id: leadId,
                    active: true,
                },
                relations: ['ocorrencia', 'produto', 'produto.produto_tipo', 'created_at_usuario'],
                order: {
                    data: 'DESC',
                    created_at: 'DESC',
                },
            });
            return activities;
        }
        catch (error) {
            throw error;
        }
    }
    async create(leadId, createActivityDto, currentUser) {
        await this.leadsService.findOne(leadId, currentUser);
        const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;
        const dataAtividade = new Date(createActivityDto.data);
        dataAtividade.setHours(0, 0, 0, 0);
        const activity = this.leadOcorrenciaRepository.create({
            leads_id: leadId,
            ocorrencia_id: createActivityDto.ocorrencia_id,
            produto_id: createActivityDto.produto_id,
            data: dataAtividade,
            active: true,
            created_at_usuarios_id: userId,
        });
        return await this.leadOcorrenciaRepository.save(activity);
    }
    async remove(id, currentUser) {
        const activity = await this.leadOcorrenciaRepository.findOne({
            where: { lead_ocorrencia_id: id },
            relations: ['created_at_usuario'],
        });
        if (!activity) {
            throw new common_1.NotFoundException('Atividade não encontrada');
        }
        if (!activity.active) {
            throw new common_1.NotFoundException('Atividade já foi removida');
        }
        const isAdmin = currentUser.perfil === user_entity_1.UserProfile.ADMIN;
        if (!isAdmin) {
            if (activity.created_at_usuarios_id !== currentUser.id) {
                throw new common_1.ForbiddenException('Você não tem permissão para remover esta atividade');
            }
            const oneHourAgo = new Date();
            oneHourAgo.setHours(oneHourAgo.getHours() - 1);
            if (activity.created_at < oneHourAgo) {
                throw new common_1.ForbiddenException('Apenas atividades criadas há menos de 1 hora podem ser removidas');
            }
        }
        const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;
        activity.active = false;
        activity.deleted_at_usuarios_id = userId;
        await this.leadOcorrenciaRepository.save(activity);
    }
    canDelete(activity, currentUser) {
        if (currentUser.perfil === user_entity_1.UserProfile.ADMIN) {
            return true;
        }
        if (activity.created_at_usuarios_id !== currentUser.id) {
            return false;
        }
        const oneHourAgo = new Date();
        oneHourAgo.setHours(oneHourAgo.getHours() - 1);
        return activity.created_at >= oneHourAgo;
    }
};
exports.LeadActivitiesService = LeadActivitiesService;
exports.LeadActivitiesService = LeadActivitiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(lead_ocorrencia_entity_1.LeadOcorrencia)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        leads_service_1.LeadsService])
], LeadActivitiesService);
//# sourceMappingURL=lead-activities.service.js.map