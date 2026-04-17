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
exports.LeadOcorrencia = void 0;
const typeorm_1 = require("typeorm");
const lead_entity_1 = require("../../leads/entities/lead.entity");
const ocorrencia_entity_1 = require("../../ocorrencias/entities/ocorrencia.entity");
const produto_entity_1 = require("../../produtos/entities/produto.entity");
const user_entity_1 = require("../../users/entities/user.entity");
let LeadOcorrencia = class LeadOcorrencia {
};
exports.LeadOcorrencia = LeadOcorrencia;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'lead_ocorrencia_id' }),
    __metadata("design:type", Number)
], LeadOcorrencia.prototype, "lead_ocorrencia_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'leads_id' }),
    __metadata("design:type", Number)
], LeadOcorrencia.prototype, "leads_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => lead_entity_1.Lead),
    (0, typeorm_1.JoinColumn)({ name: 'leads_id' }),
    __metadata("design:type", lead_entity_1.Lead)
], LeadOcorrencia.prototype, "lead", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'ocorrencia_id' }),
    __metadata("design:type", Number)
], LeadOcorrencia.prototype, "ocorrencia_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ocorrencia_entity_1.Ocorrencia),
    (0, typeorm_1.JoinColumn)({ name: 'ocorrencia_id' }),
    __metadata("design:type", ocorrencia_entity_1.Ocorrencia)
], LeadOcorrencia.prototype, "ocorrencia", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'produto_id' }),
    __metadata("design:type", Number)
], LeadOcorrencia.prototype, "produto_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => produto_entity_1.Produto),
    (0, typeorm_1.JoinColumn)({ name: 'produto_id' }),
    __metadata("design:type", produto_entity_1.Produto)
], LeadOcorrencia.prototype, "produto", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], LeadOcorrencia.prototype, "data", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], LeadOcorrencia.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamp' }),
    __metadata("design:type", Date)
], LeadOcorrencia.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'created_at_usuarios_id', nullable: false, default: 1 }),
    __metadata("design:type", Number)
], LeadOcorrencia.prototype, "created_at_usuarios_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'created_at_usuarios_id' }),
    __metadata("design:type", user_entity_1.User)
], LeadOcorrencia.prototype, "created_at_usuario", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'deleted_at_usuarios_id', nullable: true }),
    __metadata("design:type", Number)
], LeadOcorrencia.prototype, "deleted_at_usuarios_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'deleted_at_usuarios_id' }),
    __metadata("design:type", user_entity_1.User)
], LeadOcorrencia.prototype, "deleted_at_usuario", void 0);
exports.LeadOcorrencia = LeadOcorrencia = __decorate([
    (0, typeorm_1.Entity)('lead_ocorrencia')
], LeadOcorrencia);
//# sourceMappingURL=lead-ocorrencia.entity.js.map