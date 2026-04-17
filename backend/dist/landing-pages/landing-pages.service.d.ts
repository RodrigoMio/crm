import { Repository } from 'typeorm';
import { LandingPage } from './entities/landing-page.entity';
import { LandingPageProduto } from './entities/landing-page-produto.entity';
import { User } from '../users/entities/user.entity';
import { CreateLandingPageDto } from './dto/create-landing-page.dto';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';
import { CaptureLeadDto } from './dto/capture-lead.dto';
import { Lead } from '../leads/entities/lead.entity';
import { Produto } from '../produtos/entities/produto.entity';
import { LeadsProduto } from '../leads-produtos/entities/leads-produto.entity';
export declare class LandingPagesService {
    private readonly landingPagesRepository;
    private readonly landingPageProdutoRepository;
    private readonly produtosRepository;
    private readonly leadsProdutoRepository;
    private readonly usersRepository;
    private readonly leadsRepository;
    constructor(landingPagesRepository: Repository<LandingPage>, landingPageProdutoRepository: Repository<LandingPageProduto>, produtosRepository: Repository<Produto>, leadsProdutoRepository: Repository<LeadsProduto>, usersRepository: Repository<User>, leadsRepository: Repository<Lead>);
    private normalizeSlug;
    private normalizePhone;
    private normalizeAuthorizedDomains;
    private extractHostnameFromHeader;
    private extractIp;
    private isAdmin;
    private isAgente;
    private ensureAdminOrAgente;
    private validateAssignments;
    findAll(currentUser: User): Promise<LandingPage[]>;
    checkSlugAvailability(slug: string, excludeId?: number): Promise<{
        available: boolean;
    }>;
    create(dto: CreateLandingPageDto, currentUser: User): Promise<LandingPage>;
    update(id: number, dto: UpdateLandingPageDto, currentUser: User): Promise<LandingPage>;
    toggleActive(id: number, currentUser: User): Promise<LandingPage>;
    private findOneInternal;
    findProdutosByLandingPage(id: number, currentUser: User): Promise<{
        produto_id: number;
        descricao: string;
    }[]>;
    private setProdutosForLandingPage;
    findPublicBySlug(slug: string): Promise<Partial<LandingPage> & {
        products: {
            produto_id: number;
            descricao: string;
        }[];
    }>;
    captureLead(dto: CaptureLeadDto, req: any): Promise<{
        message: string;
    }>;
}
