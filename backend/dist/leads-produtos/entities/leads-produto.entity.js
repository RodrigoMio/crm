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
exports.LeadsProduto = void 0;
const typeorm_1 = require("typeorm");
const lead_entity_1 = require("../../leads/entities/lead.entity");
const produto_entity_1 = require("../../produtos/entities/produto.entity");
let LeadsProduto = class LeadsProduto {
};
exports.LeadsProduto = LeadsProduto;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ name: 'leads_produto_id' }),
    __metadata("design:type", Number)
], LeadsProduto.prototype, "leads_produto_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'leads_id' }),
    __metadata("design:type", Number)
], LeadsProduto.prototype, "leads_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => lead_entity_1.Lead),
    (0, typeorm_1.JoinColumn)({ name: 'leads_id' }),
    __metadata("design:type", lead_entity_1.Lead)
], LeadsProduto.prototype, "lead", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'produto_id' }),
    __metadata("design:type", Number)
], LeadsProduto.prototype, "produto_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => produto_entity_1.Produto),
    (0, typeorm_1.JoinColumn)({ name: 'produto_id' }),
    __metadata("design:type", produto_entity_1.Produto)
], LeadsProduto.prototype, "produto", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'insert_by_lead', default: false }),
    __metadata("design:type", Boolean)
], LeadsProduto.prototype, "insert_by_lead", void 0);
exports.LeadsProduto = LeadsProduto = __decorate([
    (0, typeorm_1.Entity)('leads_produto')
], LeadsProduto);
//# sourceMappingURL=leads-produto.entity.js.map