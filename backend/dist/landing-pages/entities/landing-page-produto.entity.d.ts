import { LandingPage } from './landing-page.entity';
import { Produto } from '../../produtos/entities/produto.entity';
export declare class LandingPageProduto {
    id: number;
    landing_page_id: number;
    produto_id: number;
    landing_page: LandingPage;
    produto: Produto;
}
