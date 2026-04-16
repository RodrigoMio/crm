import { IsBoolean, IsEmail, IsISO8601, IsOptional, IsString, IsArray, ArrayNotEmpty, IsInt, Min, MaxLength, Length } from 'class-validator';

export class CaptureLeadDto {
  @IsString()
  nome: string;

  @IsString()
  telefone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  lead_msg_interesse: string;

  @IsString()
  slug: string;

  @IsString()
  token: string;

  @IsBoolean()
  lgpd_aceite: boolean;

  @IsISO8601()
  lgpd_data_aceite: string;

  @IsOptional()
  @IsString()
  lgpd_ip_origem?: string;

  @IsString()
  lgpd_versao_texto: string;

  // Novos campos
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  products?: number[];

  @IsOptional()
  @IsString()
  @MaxLength(255)
  municipio?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  uf?: string;
}

