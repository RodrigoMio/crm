import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsBoolean, IsInt, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserProfile } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  @MinLength(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
  nome: string;

  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  senha: string;

  @IsEnum(UserProfile, { message: 'Perfil deve ser ADMIN, AGENTE ou COLABORADOR' })
  perfil: UserProfile;

  @IsOptional()
  @IsInt({ message: 'usuario_id_pai deve ser um número inteiro' })
  @ValidateIf((o) => o.perfil === UserProfile.COLABORADOR)
  usuario_id_pai?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean({ message: 'Ativo deve ser true ou false' })
  ativo?: boolean;
}




