export declare class CreateLandingPageDto {
    titulo: string;
    slug: string;
    texto_principal: string;
    texto_secundario: string;
    font_size_principal?: number;
    font_size_secundaria?: number;
    background_color?: string;
    font_color_primary?: string;
    font_color_secondary?: string;
    vendedor_id?: number;
    usuario_id_colaborador?: number;
    tipo_fluxo: 'VENDEDOR' | 'COMPRADOR';
    dominio_autorizado?: string;
    produtos_ids?: number[];
}
