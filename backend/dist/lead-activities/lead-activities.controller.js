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
exports.LeadActivitiesController = void 0;
const common_1 = require("@nestjs/common");
const lead_activities_service_1 = require("./lead-activities.service");
const create_activity_dto_1 = require("./dto/create-activity.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let LeadActivitiesController = class LeadActivitiesController {
    constructor(leadActivitiesService) {
        this.leadActivitiesService = leadActivitiesService;
    }
    findAll(leadId, req) {
        return this.leadActivitiesService.findAllByLead(leadId, req.user);
    }
    create(leadId, createActivityDto, req) {
        return this.leadActivitiesService.create(leadId, createActivityDto, req.user);
    }
    remove(id, req) {
        return this.leadActivitiesService.remove(id, req.user);
    }
};
exports.LeadActivitiesController = LeadActivitiesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('leadId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], LeadActivitiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Param)('leadId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_activity_dto_1.CreateActivityDto, Object]),
    __metadata("design:returntype", void 0)
], LeadActivitiesController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], LeadActivitiesController.prototype, "remove", null);
exports.LeadActivitiesController = LeadActivitiesController = __decorate([
    (0, common_1.Controller)('leads/:leadId/activities'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [lead_activities_service_1.LeadActivitiesService])
], LeadActivitiesController);
//# sourceMappingURL=lead-activities.controller.js.map