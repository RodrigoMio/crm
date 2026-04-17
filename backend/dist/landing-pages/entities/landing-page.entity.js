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
exports.LandingPage = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
let LandingPage = class LandingPage {
};
exports.LandingPage = LandingPage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], LandingPage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], LandingPage.prototype, "titulo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], LandingPage.prototype, "texto_principal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 24 }),
    __metadata("design:type", Number)
], LandingPage.prototype, "font_size_principal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 12 }),
    __metadata("design:type", Number)
], LandingPage.prototype, "font_size_secundaria", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], LandingPage.prototype, "texto_secundario", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, default: '#4A4A4A' }),
    __metadata("design:type", String)
], LandingPage.prototype, "background_color", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, default: '#72EDED' }),
    __metadata("design:type", String)
], LandingPage.prototype, "font_color_primary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, default: '#FFFFFF' }),
    __metadata("design:type", String)
], LandingPage.prototype, "font_color_secondary", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, unique: true }),
    __metadata("design:type", String)
], LandingPage.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, unique: true }),
    __metadata("design:type", String)
], LandingPage.prototype, "token", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], LandingPage.prototype, "vendedor_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'vendedor_id' }),
    __metadata("design:type", user_entity_1.User)
], LandingPage.prototype, "vendedor", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], LandingPage.prototype, "usuario_id_colaborador", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id_colaborador' }),
    __metadata("design:type", user_entity_1.User)
], LandingPage.prototype, "colaborador", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], LandingPage.prototype, "kanban_status_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", String)
], LandingPage.prototype, "tipo_fluxo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], LandingPage.prototype, "dominio_autorizado", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], LandingPage.prototype, "active", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LandingPage.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], LandingPage.prototype, "updated_at", void 0);
exports.LandingPage = LandingPage = __decorate([
    (0, typeorm_1.Entity)('landing_pages')
], LandingPage);
//# sourceMappingURL=landing-page.entity.js.map