import { User } from '../../users/entities/user.entity';
export type TipoFluxo = 'VENDEDOR' | 'COMPRADOR';
export declare class LandingPage {
    id: number;
    titulo: string;
    texto_principal: string;
    font_size_principal: number;
    font_size_secundaria: number;
    texto_secundario: string;
    background_color: string;
    font_color_primary: string;
    font_color_secondary: string;
    slug: string;
    token: string;
    vendedor_id: number | null;
    vendedor: User | null;
    usuario_id_colaborador: number | null;
    colaborador: User | null;
    kanban_status_id: number | null;
    tipo_fluxo: TipoFluxo | null;
    dominio_autorizado: string | null;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}
