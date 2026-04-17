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
exports.Occurrence = exports.OccurrenceType = void 0;
const typeorm_1 = require("typeorm");
const lead_entity_1 = require("../../leads/entities/lead.entity");
const user_entity_1 = require("../../users/entities/user.entity");
var OccurrenceType;
(function (OccurrenceType) {
    OccurrenceType["SISTEMA"] = "SISTEMA";
    OccurrenceType["USUARIO"] = "USUARIO";
})(OccurrenceType || (exports.OccurrenceType = OccurrenceType = {}));
let Occurrence = class Occurrence {
};
exports.Occurrence = Occurrence;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Occurrence.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'leads_id' }),
    __metadata("design:type", Number)
], Occurrence.prototype, "leads_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => lead_entity_1.Lead),
    (0, typeorm_1.JoinColumn)({ name: 'leads_id' }),
    __metadata("design:type", lead_entity_1.Lead)
], Occurrence.prototype, "lead", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', name: 'usuarios_id' }),
    __metadata("design:type", Number)
], Occurrence.prototype, "usuarios_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'usuarios_id' }),
    __metadata("design:type", user_entity_1.User)
], Occurrence.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Occurrence.prototype, "texto", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 50,
        nullable: true,
    }),
    __metadata("design:type", String)
], Occurrence.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['COMPRADOR', 'VENDEDOR'],
        nullable: true,
        name: 'tipo_fluxo'
    }),
    __metadata("design:type", String)
], Occurrence.prototype, "tipo_fluxo", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', type: 'timestamptz' }),
    __metadata("design:type", Date)
], Occurrence.prototype, "created_at", void 0);
exports.Occurrence = Occurrence = __decorate([
    (0, typeorm_1.Entity)('occurrences')
], Occurrence);
//# sourceMappingURL=occurrence.entity.js.map