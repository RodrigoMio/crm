import { LandingPagesService } from './landing-pages.service';
import { CaptureLeadDto } from './dto/capture-lead.dto';
export declare class LandingPagesPublicController {
    private readonly landingPagesService;
    constructor(landingPagesService: LandingPagesService);
    findBySlug(slug: string): Promise<Partial<import("./entities/landing-page.entity").LandingPage> & {
        products: {
            produto_id: number;
            descricao: string;
        }[];
    }>;
    captureLead(dto: CaptureLeadDto, req: any): Promise<{
        message: string;
    }>;
}
