import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { LeadsImportService } from './leads-import.service';
export declare class LeadsController {
    private readonly leadsService;
    private readonly leadsImportService;
    constructor(leadsService: LeadsService, leadsImportService: LeadsImportService);
    create(createLeadDto: CreateLeadDto, req: any): Promise<import("./entities/lead.entity").Lead>;
    findAll(query: any, req: any): Promise<{
        data: import("./entities/lead.entity").Lead[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getMaxId(): Promise<{
        maxId: number;
    }>;
    findAvailableOrigens(req: any): Promise<string[]>;
    findOne(id: number, req: any): Promise<import("./entities/lead.entity").Lead>;
    update(id: number, updateLeadDto: UpdateLeadDto, req: any): Promise<import("./entities/lead.entity").Lead>;
    remove(id: number, req: any): Promise<void>;
    checkKanbanStatus(id: number, tipoFluxo: string, req: any): Promise<{
        hasStatus: boolean;
    }>;
    importLeads(file: any, req: any): Promise<{
        message: string;
        importedCount: number;
        idsIgnorados: number;
    }>;
}
