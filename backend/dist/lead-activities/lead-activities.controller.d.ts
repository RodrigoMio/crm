import { LeadActivitiesService } from './lead-activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
export declare class LeadActivitiesController {
    private readonly leadActivitiesService;
    constructor(leadActivitiesService: LeadActivitiesService);
    findAll(leadId: number, req: any): Promise<import("../lead-ocorrencias/entities/lead-ocorrencia.entity").LeadOcorrencia[]>;
    create(leadId: number, createActivityDto: CreateActivityDto, req: any): Promise<import("../lead-ocorrencias/entities/lead-ocorrencia.entity").LeadOcorrencia>;
    remove(id: number, req: any): Promise<void>;
}
