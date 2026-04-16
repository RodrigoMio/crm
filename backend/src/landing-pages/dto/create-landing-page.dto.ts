import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  Matches,
  IsIn,
} from 'class-validator';

const HEX_COLOR = /^#([A-Fa-f0-9]{6})$/;

export class CreateLandingPageDto {
  @IsString()
  titulo: string;

  @IsString()
  slug: string;

  @IsString()
  texto_principal: string;

  @IsString()
  texto_secundario: string;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100)
  font_size_principal?: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(100)
  font_size_secundaria?: number;

  @IsOptional()
  @IsString()
  @Matches(HEX_COLOR, { message: 'Cor de fundo inválida' })
  background_color?: string;

  @IsOptional()
  @IsString()
  @Matches(HEX_COLOR, { message: 'Cor principal inválida' })
  font_color_primary?: string;

  @IsOptional()
  @IsString()
  @Matches(HEX_COLOR, { message: 'Cor secundária inválida' })
  font_color_secondary?: string;

  @IsOptional()
  @IsInt()
  vendedor_id?: number;

  @IsOptional()
  @IsInt()
  usuario_id_colaborador?: number;

  @IsString()
  @IsIn(['VENDEDOR', 'COMPRADOR'])
  tipo_fluxo: 'VENDEDOR' | 'COMPRADOR';

  @IsOptional()
  @IsString()
  dominio_autorizado?: string;

  @IsOptional()
  produtos_ids?: number[]; // IDs de produtos vinculados à LP (apenas tipo 1)
}

