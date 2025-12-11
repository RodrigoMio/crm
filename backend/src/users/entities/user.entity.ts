import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Lead } from '../../leads/entities/lead.entity';

export enum UserProfile {
  ADMIN = 'ADMIN',
  AGENTE = 'AGENTE',
}

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  senha: string; // Será hash com bcrypt

  @Column({
    type: 'enum',
    enum: UserProfile,
    default: UserProfile.AGENTE,
  })
  perfil: UserProfile;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relacionamento: um usuário pode ter vários leads
  @OneToMany(() => Lead, (lead) => lead.vendedor)
  leads: Lead[];
}




