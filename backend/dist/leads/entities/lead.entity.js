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
exports.Lead = exports.OrigemLead = exports.ItemInteresse = exports.LeadStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const kanban_status_entity_1 = require("../../kanban-modelos/entities/kanban-status.entity");
var LeadStatus;
(function (LeadStatus) {
    LeadStatus["NAO_ATENDEU"] = "NAO_ATENDEU";
    LeadStatus["NAO_E_MOMENTO"] = "NAO_E_MOMENTO";
    LeadStatus["TEM_INTERESSE"] = "TEM_INTERESSE";
    LeadStatus["NAO_TEM_INTERESSE"] = "NAO_TEM_INTERESSE";
    LeadStatus["TELEFONE_INVALIDO"] = "TELEFONE_INVALIDO";
    LeadStatus["LEAD_QUENTE"] = "LEAD_QUENTE";
    LeadStatus["RETORNO_AGENDADO"] = "RETORNO_AGENDADO";
    LeadStatus["NAO_E_PECUARISTA"] = "NAO_E_PECUARISTA";
    LeadStatus["AGUARDANDO_OFERTAS"] = "AGUARDANDO_OFERTAS";
})(LeadStatus || (exports.LeadStatus = LeadStatus = {}));
var ItemInteresse;
(function (ItemInteresse) {
    ItemInteresse["GIR"] = "GIR";
    ItemInteresse["GUZERA"] = "GUZERA";
    ItemInteresse["INDUBRASIL"] = "INDUBRASIL";
    ItemInteresse["SINDI"] = "SINDI";
    ItemInteresse["NELORE"] = "NELORE";
    ItemInteresse["NELORE_MOCHO"] = "NELORE_MOCHO";
    ItemInteresse["TABAPUA"] = "TABAPUA";
    ItemInteresse["BRAHMAN"] = "BRAHMAN";
    ItemInteresse["ANGUS"] = "ANGUS";
    ItemInteresse["GIROLANDO"] = "GIROLANDO";
    ItemInteresse["NELORE_PINTADO"] = "NELORE_PINTADO";
    ItemInteresse["HOLANDES"] = "HOLANDES";
    ItemInteresse["BRANGUS"] = "BRANGUS";
})(ItemInteresse || (exports.ItemInteresse = ItemInteresse = {}));
var OrigemLead;
(function (OrigemLead) {
    OrigemLead["CAMPANHA_MKT"] = "CAMPANHA_MKT";
    OrigemLead["HABILITADOS"] = "HABILITADOS";
    OrigemLead["BASE_RD"] = "BASE_RD";
    OrigemLead["NETWORKING"] = "NETWORKING";
    OrigemLead["WHATSAPP"] = "WHATSAPP";
    OrigemLead["AGENTE_VENDAS"] = "AGENTE_VENDAS";
    OrigemLead["BASE_CANAL_DO_CAMPO"] = "BASE_CANAL_DO_CAMPO";
})(OrigemLead || (exports.OrigemLead = OrigemLead = {}));
let Lead = class Lead {
};
exports.Lead = Lead;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Lead.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Lead.prototype, "data_entrada", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Lead.prototype, "nome_razao_social", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "nome_fantasia_apelido", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "telefone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "lead_msg_interesse", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Lead.prototype, "lgpd_aceite", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true, precision: 6 }),
    __metadata("design:type", Date)
], Lead.prototype, "lgpd_data_aceite", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true, length: 45 }),
    __metadata("design:type", String)
], Lead.prototype, "lgpd_ip_origem", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "lgpd_versao_texto", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 2, nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "uf", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "municipio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "anotacoes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Lead.prototype, "origem_lead", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], Lead.prototype, "vendedor_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.leads, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'vendedor_id' }),
    __metadata("design:type", user_entity_1.User)
], Lead.prototype, "vendedor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], Lead.prototype, "usuario_id_colaborador", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id_colaborador' }),
    __metadata("design:type", user_entity_1.User)
], Lead.prototype, "colaborador", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true, name: 'kanban_status_id' }),
    __metadata("design:type", Number)
], Lead.prototype, "kanban_status_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => kanban_status_entity_1.KanbanStatus, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'kanban_status_id' }),
    __metadata("design:type", kanban_status_entity_1.KanbanStatus)
], Lead.prototype, "kanbanStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true, name: 'total_conversoes' }),
    __metadata("design:type", Number)
], Lead.prototype, "total_conversoes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', array: true, nullable: true, name: 'tipo_lead' }),
    __metadata("design:type", Array)
], Lead.prototype, "tipo_lead", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Lead.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Lead.prototype, "updated_at", void 0);
exports.Lead = Lead = __decorate([
    (0, typeorm_1.Entity)('leads')
], Lead);
//# sourceMappingURL=lead.entity.js.map