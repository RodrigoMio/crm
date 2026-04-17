import { Repository } from 'typeorm';
import { Occurrence } from './entities/occurrence.entity';
import { CreateOccurrenceDto } from './dto/create-occurrence.dto';
import { User } from '../users/entities/user.entity';
import { LeadsService } from '../leads/leads.service';
export declare class OccurrencesService {
    private occurrencesRepository;
    private leadsService;
    constructor(occurrencesRepository: Repository<Occurrence>, leadsService: LeadsService);
    findAllByLead(leadId: number, currentUser: User): Promise<Occurrence[]>;
    create(leadId: number, createOccurrenceDto: CreateOccurrenceDto, currentUser: User): Promise<Occurrence>;
    remove(id: number, currentUser: User): Promise<void>;
    canDelete(occurrence: Occurrence, currentUser: User): boolean;
}
