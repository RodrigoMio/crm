import { Repository, DataSource } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { User } from '../users/entities/user.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { FilterLeadsDto } from './dto/filter-leads.dto';
import { Produto } from '../produtos/entities/produto.entity';
import { Ocorrencia } from '../ocorrencias/entities/ocorrencia.entity';
import { LeadOcorrencia } from '../lead-ocorrencias/entities/lead-ocorrencia.entity';
import { LeadsProduto } from '../leads-produtos/entities/leads-produto.entity';
export declare class LeadsService {
    private leadsRepository;
    private usersRepository;
    private produtoRepository;
    private ocorrenciaRepository;
    private leadOcorrenciaRepository;
    private leadsProdutoRepository;
    private dataSource;
    constructor(leadsRepository: Repository<Lead>, usersRepository: Repository<User>, produtoRepository: Repository<Produto>, ocorrenciaRepository: Repository<Ocorrencia>, leadOcorrenciaRepository: Repository<LeadOcorrencia>, leadsProdutoRepository: Repository<LeadsProduto>, dataSource: DataSource);
    private normalizeId;
    private accentInsensitiveKey;
    create(createLeadDto: CreateLeadDto, currentUser: User): Promise<Lead>;
    getMaxId(): Promise<number | null>;
    findAvailableOrigens(currentUser: User): Promise<string[]>;
    findAll(filterDto: FilterLeadsDto, currentUser: User): Promise<{
        data: Lead[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: number, currentUser: User): Promise<Lead>;
    update(id: number, updateLeadDto: UpdateLeadDto, currentUser: User): Promise<Lead>;
    remove(id: number, currentUser: User): Promise<void>;
    checkKanbanStatus(id: number, tipoFluxo: string, currentUser: User): Promise<{
        hasStatus: boolean;
    }>;
    private findOrCreateProduto;
    private findOrCreateOcorrencia;
    private findOrCreateLeadsProduto;
    private syncProdutos;
    private parseOcorrenciaDate;
    private processOcorrencias;
    private processTags;
    private processOcorrenciasWithCache;
    private processTagsWithCache;
    importLeads(leadsData: any[], currentUser: User): Promise<{
        success: number;
        error: any;
        idsIgnorados: number;
    }>;
}
