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
Object.defineProperty(exports, "__esModule", { value: true });
exports.KanbanModelo = void 0;
const typeorm_1 = require("typeorm");
const kanban_modelo_status_entity_1 = require("./kanban-modelo-status.entity");
let KanbanModelo = class KanbanModelo {
};
exports.KanbanModelo = KanbanModelo;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'kanban_modelo_id' }),
    __metadata("design:type", Number)
], KanbanModelo.prototype, "kanban_modelo_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], KanbanModelo.prototype, "descricao", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: true, default: true }),
    __metadata("design:type", Boolean)
], KanbanModelo.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 20,
        nullable: true,
        name: 'tipo_fluxo',
    }),
    __metadata("design:type", String)
], KanbanModelo.prototype, "tipo_fluxo", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => kanban_modelo_status_entity_1.KanbanModeloStatus, (modeloStatus) => modeloStatus.kanbanModelo),
    __metadata("design:type", Array)
], KanbanModelo.prototype, "modeloStatuses", void 0);
exports.KanbanModelo = KanbanModelo = __decorate([
    (0, typeorm_1.Entity)('kanban_modelo')
], KanbanModelo);
//# sourceMappingURL=kanban-modelo.entity.js.map