import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsBoolean, IsInt, ValidateIf } from 'class-validator';
import { UserProfile } from '../entities/user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  nome?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  senha?: string;

  @IsOptional()
  @IsEnum(UserProfile)
  perfil?: UserProfile;

  @IsOptional()
  @IsInt({ message: 'usuario_id_pai deve ser um número inteiro' })
  @ValidateIf((o) => o.perfil === UserProfile.COLABORADOR)
  usuario_id_pai?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}







