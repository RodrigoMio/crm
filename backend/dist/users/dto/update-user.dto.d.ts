import { UserProfile } from '../entities/user.entity';
export declare class UpdateUserDto {
    nome?: string;
    email?: string;
    senha?: string;
    perfil?: UserProfile;
    usuario_id_pai?: number;
    ativo?: boolean;
}
