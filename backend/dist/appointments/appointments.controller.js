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
exports.AppointmentsControllerById = exports.AppointmentsController = void 0;
const common_1 = require("@nestjs/common");
const appointments_service_1 = require("./appointments.service");
const create_appointment_dto_1 = require("./dto/create-appointment.dto");
const reschedule_appointment_dto_1 = require("./dto/reschedule-appointment.dto");
const filter_appointments_dto_1 = require("./dto/filter-appointments.dto");
const move_appointment_dto_1 = require("./dto/move-appointment.dto");
const complete_appointment_dto_1 = require("./dto/complete-appointment.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let AppointmentsController = class AppointmentsController {
    constructor(appointmentsService) {
        this.appointmentsService = appointmentsService;
    }
    findScheduled(leadId, req) {
        return this.appointmentsService.findScheduledByLead(leadId, req.user);
    }
    findAll(leadId, req) {
        return this.appointmentsService.findAllByLead(leadId, req.user);
    }
    create(leadId, createAppointmentDto, req) {
        return this.appointmentsService.create(leadId, createAppointmentDto, req.user);
    }
};
exports.AppointmentsController = AppointmentsController;
__decorate([
    (0, common_1.Get)('scheduled'),
    __param(0, (0, common_1.Param)('leadId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "findScheduled", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('leadId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Param)('leadId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_appointment_dto_1.CreateAppointmentDto, Object]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "create", null);
exports.AppointmentsController = AppointmentsController = __decorate([
    (0, common_1.Controller)('leads/:leadId/appointments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [appointments_service_1.AppointmentsService])
], AppointmentsController);
let AppointmentsControllerById = class AppointmentsControllerById {
    constructor(appointmentsService) {
        this.appointmentsService = appointmentsService;
    }
    findOne(id, req) {
        return this.appointmentsService.findOne(id, req.user);
    }
    reschedule(id, rescheduleDto, req) {
        return this.appointmentsService.reschedule(id, rescheduleDto, req.user);
    }
    cancel(id, req) {
        return this.appointmentsService.cancel(id, req.user);
    }
    complete(id, completeDto, req) {
        return this.appointmentsService.complete(id, completeDto, req.user);
    }
    markNoShow(id, req) {
        return this.appointmentsService.markNoShow(id, req.user);
    }
    move(id, moveDto, req) {
        return this.appointmentsService.move(id, new Date(moveDto.newDate), req.user);
    }
    findAll(filterDto, req) {
        return this.appointmentsService.findAll(filterDto, req.user);
    }
};
exports.AppointmentsControllerById = AppointmentsControllerById;
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], AppointmentsControllerById.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/reschedule'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, reschedule_appointment_dto_1.RescheduleAppointmentDto, Object]),
    __metadata("design:returntype", void 0)
], AppointmentsControllerById.prototype, "reschedule", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], AppointmentsControllerById.prototype, "cancel", null);
__decorate([
    (0, common_1.Patch)(':id/complete'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, complete_appointment_dto_1.CompleteAppointmentDto, Object]),
    __metadata("design:returntype", void 0)
], AppointmentsControllerById.prototype, "complete", null);
__decorate([
    (0, common_1.Patch)(':id/no-show'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], AppointmentsControllerById.prototype, "markNoShow", null);
__decorate([
    (0, common_1.Patch)(':id/move'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, move_appointment_dto_1.MoveAppointmentDto, Object]),
    __metadata("design:returntype", void 0)
], AppointmentsControllerById.prototype, "move", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filter_appointments_dto_1.FilterAppointmentsDto, Object]),
    __metadata("design:returntype", void 0)
], AppointmentsControllerById.prototype, "findAll", null);
exports.AppointmentsControllerById = AppointmentsControllerById = __decorate([
    (0, common_1.Controller)('appointments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [appointments_service_1.AppointmentsService])
], AppointmentsControllerById);
//# sourceMappingURL=appointments.controller.js.map