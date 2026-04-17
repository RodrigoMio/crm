import { OccurrencesService } from './occurrences.service';
import { CreateOccurrenceDto } from './dto/create-occurrence.dto';
export declare class OccurrencesController {
    private readonly occurrencesService;
    constructor(occurrencesService: OccurrencesService);
    findAll(leadId: number, req: any): Promise<import("./entities/occurrence.entity").Occurrence[]>;
    create(leadId: number, createOccurrenceDto: CreateOccurrenceDto, req: any): Promise<import("./entities/occurrence.entity").Occurrence>;
    remove(id: number, req: any): Promise<void>;
}
