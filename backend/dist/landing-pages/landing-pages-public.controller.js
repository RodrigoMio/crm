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
exports.LandingPagesPublicController = void 0;
const common_1 = require("@nestjs/common");
const landing_pages_service_1 = require("./landing-pages.service");
const capture_lead_dto_1 = require("./dto/capture-lead.dto");
let LandingPagesPublicController = class LandingPagesPublicController {
    constructor(landingPagesService) {
        this.landingPagesService = landingPagesService;
    }
    findBySlug(slug) {
        return this.landingPagesService.findPublicBySlug(slug);
    }
    captureLead(dto, req) {
        return this.landingPagesService.captureLead(dto, req);
    }
};
exports.LandingPagesPublicController = LandingPagesPublicController;
__decorate([
    (0, common_1.Get)(':slug'),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LandingPagesPublicController.prototype, "findBySlug", null);
__decorate([
    (0, common_1.Post)('capture'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [capture_lead_dto_1.CaptureLeadDto, Object]),
    __metadata("design:returntype", void 0)
], LandingPagesPublicController.prototype, "captureLead", null);
exports.LandingPagesPublicController = LandingPagesPublicController = __decorate([
    (0, common_1.Controller)('public/lp'),
    __metadata("design:paramtypes", [landing_pages_service_1.LandingPagesService])
], LandingPagesPublicController);
//# sourceMappingURL=landing-pages-public.controller.js.map