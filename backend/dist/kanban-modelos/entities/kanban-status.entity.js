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
exports.KanbanStatus = void 0;
const typeorm_1 = require("typeorm");
const kanban_modelo_status_entity_1 = require("./kanban-modelo-status.entity");
let KanbanStatus = class KanbanStatus {
};
exports.KanbanStatus = KanbanStatus;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'kanban_status_id' }),
    __metadata("design:type", Number)
], KanbanStatus.prototype, "kanban_status_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], KanbanStatus.prototype, "descricao", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true, name: 'bg_color' }),
    __metadata("design:type", String)
], KanbanStatus.prototype, "bg_color", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, nullable: true, name: 'text_color' }),
    __metadata("design:type", String)
], KanbanStatus.prototype, "text_color", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', nullable: true, default: true }),
    __metadata("design:type", Boolean)
], KanbanStatus.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => kanban_modelo_status_entity_1.KanbanModeloStatus, (modeloStatus) => modeloStatus.kanbanStatus),
    __metadata("design:type", Array)
], KanbanStatus.prototype, "modeloStatuses", void 0);
exports.KanbanStatus = KanbanStatus = __decorate([
    (0, typeorm_1.Entity)('kanban_status')
], KanbanStatus);
//# sourceMappingURL=kanban-status.entity.js.map