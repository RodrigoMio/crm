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
exports.KanbanBoard = exports.KanbanBoardType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const kanban_modelo_entity_1 = require("../../kanban-modelos/entities/kanban-modelo.entity");
const kanban_status_entity_1 = require("../../kanban-modelos/entities/kanban-status.entity");
var KanbanBoardType;
(function (KanbanBoardType) {
    KanbanBoardType["ADMIN"] = "ADMIN";
    KanbanBoardType["AGENTE"] = "AGENTE";
    KanbanBoardType["COLABORADOR"] = "COLABORADOR";
})(KanbanBoardType || (exports.KanbanBoardType = KanbanBoardType = {}));
let KanbanBoard = class KanbanBoard {
};
exports.KanbanBoard = KanbanBoard;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], KanbanBoard.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], KanbanBoard.prototype, "nome", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 7, name: 'cor_hex' }),
    __metadata("design:type", String)
], KanbanBoard.prototype, "cor_hex", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true, name: 'usuario_id_dono' }),
    __metadata("design:type", Number)
], KanbanBoard.prototype, "usuario_id_dono", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id_dono' }),
    __metadata("design:type", user_entity_1.User)
], KanbanBoard.prototype, "usuario_dono", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true, name: 'agente_id' }),
    __metadata("design:type", Number)
], KanbanBoard.prototype, "agente_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'agente_id' }),
    __metadata("design:type", user_entity_1.User)
], KanbanBoard.prototype, "agente", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true, name: 'colaborador_id' }),
    __metadata("design:type", Number)
], KanbanBoard.prototype, "colaborador_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'colaborador_id' }),
    __metadata("design:type", user_entity_1.User)
], KanbanBoard.prototype, "colaborador", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true, name: 'kanban_modelo_id' }),
    __metadata("design:type", Number)
], KanbanBoard.prototype, "kanban_modelo_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => kanban_modelo_entity_1.KanbanModelo, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'kanban_modelo_id' }),
    __metadata("design:type", kanban_modelo_entity_1.KanbanModelo)
], KanbanBoard.prototype, "modelo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], KanbanBoard.prototype, "ordem", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 20,
    }),
    __metadata("design:type", String)
], KanbanBoard.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true, name: 'kanban_status_id' }),
    __metadata("design:type", Number)
], KanbanBoard.prototype, "kanban_status_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => kanban_status_entity_1.KanbanStatus, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'kanban_status_id' }),
    __metadata("design:type", kanban_status_entity_1.KanbanStatus)
], KanbanBoard.prototype, "kanbanStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'id_usuario_created_at' }),
    __metadata("design:type", Number)
], KanbanBoard.prototype, "id_usuario_created_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'id_usuario_created_at' }),
    __metadata("design:type", user_entity_1.User)
], KanbanBoard.prototype, "usuario_criador", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], KanbanBoard.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], KanbanBoard.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], KanbanBoard.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 20,
        nullable: true,
        name: 'tipo_fluxo',
    }),
    __metadata("design:type", String)
], KanbanBoard.prototype, "tipo_fluxo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0, name: 'limit_days' }),
    __metadata("design:type", Number)
], KanbanBoard.prototype, "limit_days", void 0);
exports.KanbanBoard = KanbanBoard = __decorate([
    (0, typeorm_1.Entity)('kanban_boards')
], KanbanBoard);
//# sourceMappingURL=kanban-board.entity.js.map