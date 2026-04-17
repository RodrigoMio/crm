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
exports.OccurrencesController = void 0;
const common_1 = require("@nestjs/common");
const occurrences_service_1 = require("./occurrences.service");
const create_occurrence_dto_1 = require("./dto/create-occurrence.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let OccurrencesController = class OccurrencesController {
    constructor(occurrencesService) {
        this.occurrencesService = occurrencesService;
    }
    findAll(leadId, req) {
        return this.occurrencesService.findAllByLead(leadId, req.user);
    }
    create(leadId, createOccurrenceDto, req) {
        return this.occurrencesService.create(leadId, createOccurrenceDto, req.user);
    }
    remove(id, req) {
        return this.occurrencesService.remove(id, req.user);
    }
};
exports.OccurrencesController = OccurrencesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('leadId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], OccurrencesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Param)('leadId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_occurrence_dto_1.CreateOccurrenceDto, Object]),
    __metadata("design:returntype", void 0)
], OccurrencesController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], OccurrencesController.prototype, "remove", null);
exports.OccurrencesController = OccurrencesController = __decorate([
    (0, common_1.Controller)('leads/:leadId/occurrences'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [occurrences_service_1.OccurrencesService])
], OccurrencesController);
//# sourceMappingURL=occurrences.controller.js.map