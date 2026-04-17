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
exports.KanbanModelosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const kanban_modelo_entity_1 = require("./entities/kanban-modelo.entity");
const kanban_status_entity_1 = require("./entities/kanban-status.entity");
const kanban_modelo_status_entity_1 = require("./entities/kanban-modelo-status.entity");
let KanbanModelosService = class KanbanModelosService {
    constructor(kanbanModeloRepository, kanbanStatusRepository, kanbanModeloStatusRepository) {
        this.kanbanModeloRepository = kanbanModeloRepository;
        this.kanbanStatusRepository = kanbanStatusRepository;
        this.kanbanModeloStatusRepository = kanbanModeloStatusRepository;
    }
    async findAll() {
        const modelos = await this.kanbanModeloRepository.find({
            where: { active: true },
            order: { descricao: 'ASC' },
        });
        const modelosComStatuses = await Promise.all(modelos.map(async (modelo) => {
            const modeloStatuses = await this.kanbanModeloStatusRepository.find({
                where: { kanban_modelo_id: modelo.kanban_modelo_id },
                relations: ['kanbanStatus'],
                order: { kanban_modelo_status_id: 'ASC' },
            });
            const statuses = modeloStatuses
                .map((ms) => ms.kanbanStatus)
                .filter((status) => status && status.active)
                .map((status) => ({
                kanban_status_id: status.kanban_status_id,
                descricao: status.descricao,
                bg_color: status.bg_color || '#ffffff',
                text_color: status.text_color || '#000000',
                active: status.active,
            }));
            return {
                kanban_modelo_id: modelo.kanban_modelo_id,
                descricao: modelo.descricao,
                active: modelo.active,
                tipo_fluxo: modelo.tipo_fluxo,
                statuses,
            };
        }));
        return modelosComStatuses;
    }
    async findOne(id) {
        const modelo = await this.kanbanModeloRepository.findOne({
            where: { kanban_modelo_id: id },
        });
        if (!modelo) {
            throw new common_1.NotFoundException('Modelo de kanban não encontrado');
        }
        const modeloStatuses = await this.kanbanModeloStatusRepository.find({
            where: { kanban_modelo_id: id },
            relations: ['kanbanStatus'],
            order: { kanban_modelo_status_id: 'ASC' },
        });
        const statuses = modeloStatuses
            .map((ms) => ms.kanbanStatus)
            .filter((status) => status && status.active)
            .map((status) => ({
            kanban_status_id: status.kanban_status_id,
            descricao: status.descricao,
            bg_color: status.bg_color || '#ffffff',
            text_color: status.text_color || '#000000',
            active: status.active,
        }));
        return {
            kanban_modelo_id: modelo.kanban_modelo_id,
            descricao: modelo.descricao,
            active: modelo.active,
            tipo_fluxo: modelo.tipo_fluxo,
            statuses,
        };
    }
    async create(createKanbanModeloDto) {
        const modelo = this.kanbanModeloRepository.create({
            descricao: createKanbanModeloDto.descricao,
            active: createKanbanModeloDto.active !== undefined ? createKanbanModeloDto.active : true,
        });
        return await this.kanbanModeloRepository.save(modelo);
    }
    async update(id, updateKanbanModeloDto) {
        const modelo = await this.kanbanModeloRepository.findOne({
            where: { kanban_modelo_id: id },
        });
        if (!modelo) {
            throw new common_1.NotFoundException('Modelo de kanban não encontrado');
        }
        Object.assign(modelo, updateKanbanModeloDto);
        return await this.kanbanModeloRepository.save(modelo);
    }
    async remove(id) {
        const modelo = await this.kanbanModeloRepository.findOne({
            where: { kanban_modelo_id: id },
        });
        if (!modelo) {
            throw new common_1.NotFoundException('Modelo de kanban não encontrado');
        }
        modelo.active = false;
        await this.kanbanModeloRepository.save(modelo);
    }
};
exports.KanbanModelosService = KanbanModelosService;
exports.KanbanModelosService = KanbanModelosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(kanban_modelo_entity_1.KanbanModelo)),
    __param(1, (0, typeorm_1.InjectRepository)(kanban_status_entity_1.KanbanStatus)),
    __param(2, (0, typeorm_1.InjectRepository)(kanban_modelo_status_entity_1.KanbanModeloStatus)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], KanbanModelosService);
//# sourceMappingURL=kanban-modelos.service.js.map