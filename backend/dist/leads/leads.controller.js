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
exports.LeadsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const leads_service_1 = require("./leads.service");
const create_lead_dto_1 = require("./dto/create-lead.dto");
const update_lead_dto_1 = require("./dto/update-lead.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const leads_import_service_1 = require("./leads-import.service");
let LeadsController = class LeadsController {
    constructor(leadsService, leadsImportService) {
        this.leadsService = leadsService;
        this.leadsImportService = leadsImportService;
    }
    create(createLeadDto, req) {
        return this.leadsService.create(createLeadDto, req.user);
    }
    findAll(query, req) {
        const filterDto = {
            ...query,
            produtos: query.produtos
                ? Array.isArray(query.produtos)
                    ? query.produtos.map((p) => parseInt(p, 10))
                    : [parseInt(query.produtos, 10)]
                : undefined,
            uf: query.uf
                ? Array.isArray(query.uf)
                    ? query.uf
                    : [query.uf]
                : undefined,
            vendedor_id: query.vendedor_id ? parseInt(query.vendedor_id, 10) : undefined,
            usuario_id_colaborador: query.usuario_id_colaborador ? parseInt(query.usuario_id_colaborador, 10) : undefined,
            origem_lead: query.origem_lead,
            page: query.page ? parseInt(query.page, 10) : undefined,
            limit: query.limit ? parseInt(query.limit, 10) : undefined,
        };
        return this.leadsService.findAll(filterDto, req.user);
    }
    async getMaxId() {
        const maxId = await this.leadsService.getMaxId();
        return { maxId: maxId || 0 };
    }
    findAvailableOrigens(req) {
        return this.leadsService.findAvailableOrigens(req.user);
    }
    findOne(id, req) {
        return this.leadsService.findOne(id, req.user);
    }
    update(id, updateLeadDto, req) {
        return this.leadsService.update(id, updateLeadDto, req.user);
    }
    remove(id, req) {
        return this.leadsService.remove(id, req.user);
    }
    checkKanbanStatus(id, tipoFluxo, req) {
        return this.leadsService.checkKanbanStatus(id, tipoFluxo, req.user);
    }
    async importLeads(file, req) {
        if (!file) {
            throw new common_1.BadRequestException('Arquivo não fornecido');
        }
        const filePath = file.path;
        const fileExt = (0, path_1.extname)(file.originalname).toLowerCase();
        const idInicial = req.body?.idInicial ? parseInt(req.body.idInicial, 10) : null;
        const idFinal = req.body?.idFinal ? parseInt(req.body.idFinal, 10) : null;
        if (idInicial !== null && (isNaN(idInicial) || idInicial <= 0)) {
            throw new common_1.BadRequestException('ID inicial deve ser um número positivo');
        }
        if (idFinal !== null && (isNaN(idFinal) || idFinal <= 0)) {
            throw new common_1.BadRequestException('ID final deve ser um número positivo');
        }
        if (idInicial !== null && idFinal !== null && idFinal < idInicial) {
            throw new common_1.BadRequestException('ID final deve ser maior ou igual ao ID inicial');
        }
        try {
            let leads;
            if (fileExt === '.csv') {
                leads = await this.leadsImportService.processCsvFile(filePath);
            }
            else {
                leads = await this.leadsImportService.processExcelFile(filePath);
            }
            if (idInicial !== null || idFinal !== null) {
                leads = leads.filter(lead => {
                    if (!lead.id)
                        return false;
                    const leadId = typeof lead.id === 'string' ? parseInt(lead.id.trim(), 10) : Number(lead.id);
                    if (isNaN(leadId))
                        return false;
                    if (idInicial !== null && leadId < idInicial)
                        return false;
                    if (idFinal !== null && leadId > idFinal)
                        return false;
                    return true;
                });
            }
            if (!leads || leads.length === 0) {
                const fs = require('fs');
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                throw new common_1.BadRequestException({
                    erro: 'Nenhum lead válido encontrado na planilha. Verifique se os campos obrigatórios (ID e LEAD) estão preenchidos.',
                    detalhes: 'Linhas com ID ou LEAD vazios são ignoradas automaticamente.',
                });
            }
            try {
                const result = await this.leadsService.importLeads(leads, req.user);
                const fs = require('fs');
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                let message = '';
                if (result.success === 0 && result.idsIgnorados === 0) {
                    message = 'Nenhum lead foi importado. Verifique se os IDs já existem no banco ou se os campos obrigatórios estão preenchidos.';
                }
                else if (result.success === 0 && result.idsIgnorados > 0) {
                    message = `Nenhum lead novo foi importado. ${result.idsIgnorados} ID(s) já existem no banco e foram ignorados.`;
                }
                else {
                    message = `${result.success} lead(s) importado(s) com sucesso.`;
                    if (result.idsIgnorados > 0) {
                        message += ` ${result.idsIgnorados} ID(s) já existiam e foram ignorados.`;
                    }
                }
                console.log('✅ Importação concluída:', {
                    success: result.success,
                    idsIgnorados: result.idsIgnorados,
                    message,
                });
                const response = {
                    message,
                    importedCount: result.success,
                    idsIgnorados: result.idsIgnorados || 0,
                };
                return response;
            }
            catch (importError) {
                const fs = require('fs');
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                if (importError instanceof common_1.BadRequestException) {
                    const errorResponse = importError.getResponse();
                    if (typeof errorResponse === 'object' && errorResponse !== null) {
                        if ('linha' in errorResponse || 'erro' in errorResponse) {
                            throw importError;
                        }
                    }
                }
                throw importError;
            }
        }
        catch (error) {
            const fs = require('fs');
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            if (error.response && error.response.message && typeof error.response.message === 'object') {
                throw new common_1.BadRequestException(error.response.message);
            }
            if (error.message && typeof error.message === 'object' && error.message.linha) {
                throw new common_1.BadRequestException(error.message);
            }
            if (error instanceof common_1.BadRequestException) {
                const errorResponse = error.getResponse();
                if (typeof errorResponse === 'object' && errorResponse !== null) {
                    if ('linha' in errorResponse || 'erro' in errorResponse) {
                        throw error;
                    }
                    const message = errorResponse.message || error.message;
                    throw new common_1.BadRequestException({
                        linha: 0,
                        id: 'N/A',
                        erro: Array.isArray(message) ? message.join(', ') : message,
                    });
                }
                throw error;
            }
            throw new common_1.BadRequestException({
                linha: 0,
                id: 'N/A',
                erro: error.message || 'Erro ao processar arquivo. Verifique se a planilha está no formato correto e se a primeira aba contém dados válidos.',
            });
        }
    }
};
exports.LeadsController = LeadsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lead_dto_1.CreateLeadDto, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('max-id'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "getMaxId", null);
__decorate([
    (0, common_1.Get)('origens'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "findAvailableOrigens", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_lead_dto_1.UpdateLeadDto, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/kanban-status/:tipoFluxo'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('tipoFluxo')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", void 0)
], LeadsController.prototype, "checkKanbanStatus", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `${uniqueSuffix}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            const allowedExtensions = ['.xlsx', '.xls', '.csv'];
            const ext = (0, path_1.extname)(file.originalname).toLowerCase();
            if (allowedExtensions.includes(ext)) {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException('Apenas arquivos Excel (.xlsx, .xls) ou CSV são permitidos'), false);
            }
        },
        limits: {
            fileSize: 50 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "importLeads", null);
exports.LeadsController = LeadsController = __decorate([
    (0, common_1.Controller)('leads'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [leads_service_1.LeadsService,
        leads_import_service_1.LeadsImportService])
], LeadsController);
//# sourceMappingURL=leads.controller.js.map