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
exports.LandingPagesController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const landing_pages_service_1 = require("./landing-pages.service");
const create_landing_page_dto_1 = require("./dto/create-landing-page.dto");
const update_landing_page_dto_1 = require("./dto/update-landing-page.dto");
let LandingPagesController = class LandingPagesController {
    constructor(landingPagesService) {
        this.landingPagesService = landingPagesService;
    }
    findAll(req) {
        return this.landingPagesService.findAll(req.user);
    }
    checkSlug(slug, excludeId) {
        return this.landingPagesService.checkSlugAvailability(slug || '', excludeId ? Number(excludeId) : undefined);
    }
    create(dto, req) {
        return this.landingPagesService.create(dto, req.user);
    }
    update(id, dto, req) {
        return this.landingPagesService.update(id, dto, req.user);
    }
    getProdutos(id, req) {
        return this.landingPagesService.findProdutosByLandingPage(id, req.user);
    }
    toggleActive(id, req) {
        return this.landingPagesService.toggleActive(id, req.user);
    }
};
exports.LandingPagesController = LandingPagesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LandingPagesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('check-slug'),
    __param(0, (0, common_1.Query)('slug')),
    __param(1, (0, common_1.Query)('exclude_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LandingPagesController.prototype, "checkSlug", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_landing_page_dto_1.CreateLandingPageDto, Object]),
    __metadata("design:returntype", void 0)
], LandingPagesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_landing_page_dto_1.UpdateLandingPageDto, Object]),
    __metadata("design:returntype", void 0)
], LandingPagesController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(':id/produtos'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], LandingPagesController.prototype, "getProdutos", null);
__decorate([
    (0, common_1.Patch)(':id/toggle-active'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], LandingPagesController.prototype, "toggleActive", null);
exports.LandingPagesController = LandingPagesController = __decorate([
    (0, common_1.Controller)('landing-pages'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [landing_pages_service_1.LandingPagesService])
], LandingPagesController);
//# sourceMappingURL=landing-pages.controller.js.map