import { LandingPagesService } from './landing-pages.service';
import { CreateLandingPageDto } from './dto/create-landing-page.dto';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';
export declare class LandingPagesController {
    private readonly landingPagesService;
    constructor(landingPagesService: LandingPagesService);
    findAll(req: any): Promise<import("./entities/landing-page.entity").LandingPage[]>;
    checkSlug(slug: string, excludeId?: string): Promise<{
        available: boolean;
    }>;
    create(dto: CreateLandingPageDto, req: any): Promise<import("./entities/landing-page.entity").LandingPage>;
    update(id: number, dto: UpdateLandingPageDto, req: any): Promise<import("./entities/landing-page.entity").LandingPage>;
    getProdutos(id: number, req: any): Promise<{
        produto_id: number;
        descricao: string;
    }[]>;
    toggleActive(id: number, req: any): Promise<import("./entities/landing-page.entity").LandingPage>;
}
