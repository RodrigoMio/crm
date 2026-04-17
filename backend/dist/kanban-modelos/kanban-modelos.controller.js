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
exports.KanbanModelosController = void 0;
const common_1 = require("@nestjs/common");
const kanban_modelos_service_1 = require("./kanban-modelos.service");
const create_kanban_modelo_dto_1 = require("./dto/create-kanban-modelo.dto");
const update_kanban_modelo_dto_1 = require("./dto/update-kanban-modelo.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const user_entity_1 = require("../users/entities/user.entity");
let KanbanModelosController = class KanbanModelosController {
    constructor(kanbanModelosService) {
        this.kanbanModelosService = kanbanModelosService;
    }
    findAll(req) {
        if (req.user?.perfil !== user_entity_1.UserProfile.ADMIN &&
            req.user?.perfil !== user_entity_1.UserProfile.AGENTE) {
            throw new common_1.ForbiddenException('Apenas administradores e agentes podem acessar modelos de kanban');
        }
        return this.kanbanModelosService.findAll();
    }
    findOne(id, req) {
        if (req.user?.perfil !== user_entity_1.UserProfile.ADMIN) {
            throw new common_1.ForbiddenException('Apenas administradores podem acessar modelos de kanban');
        }
        return this.kanbanModelosService.findOne(id);
    }
    create(createKanbanModeloDto, req) {
        if (req.user?.perfil !== user_entity_1.UserProfile.ADMIN) {
            throw new common_1.ForbiddenException('Apenas administradores podem criar modelos de kanban');
        }
        return this.kanbanModelosService.create(createKanbanModeloDto);
    }
    update(id, updateKanbanModeloDto, req) {
        if (req.user?.perfil !== user_entity_1.UserProfile.ADMIN) {
            throw new common_1.ForbiddenException('Apenas administradores podem atualizar modelos de kanban');
        }
        return this.kanbanModelosService.update(id, updateKanbanModeloDto);
    }
    remove(id, req) {
        if (req.user?.perfil !== user_entity_1.UserProfile.ADMIN) {
            throw new common_1.ForbiddenException('Apenas administradores podem remover modelos de kanban');
        }
        return this.kanbanModelosService.remove(id);
    }
};
exports.KanbanModelosController = KanbanModelosController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KanbanModelosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], KanbanModelosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_kanban_modelo_dto_1.CreateKanbanModeloDto, Object]),
    __metadata("design:returntype", void 0)
], KanbanModelosController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_kanban_modelo_dto_1.UpdateKanbanModeloDto, Object]),
    __metadata("design:returntype", void 0)
], KanbanModelosController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], KanbanModelosController.prototype, "remove", null);
exports.KanbanModelosController = KanbanModelosController = __decorate([
    (0, common_1.Controller)('kanban-modelos'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [kanban_modelos_service_1.KanbanModelosService])
], KanbanModelosController);
//# sourceMappingURL=kanban-modelos.controller.js.map