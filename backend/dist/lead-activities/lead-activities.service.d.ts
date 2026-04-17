import { Repository } from 'typeorm';
import { LeadOcorrencia } from '../lead-ocorrencias/entities/lead-ocorrencia.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { LeadsService } from '../leads/leads.service';
import { User } from '../users/entities/user.entity';
export declare class LeadActivitiesService {
    private leadOcorrenciaRepository;
    private leadsService;
    constructor(leadOcorrenciaRepository: Repository<LeadOcorrencia>, leadsService: LeadsService);
    findAllByLead(leadId: number, currentUser: User): Promise<LeadOcorrencia[]>;
    create(leadId: number, createActivityDto: CreateActivityDto, currentUser: User): Promise<LeadOcorrencia>;
    remove(id: number, currentUser: User): Promise<void>;
    canDelete(activity: LeadOcorrencia, currentUser: User): boolean;
}
