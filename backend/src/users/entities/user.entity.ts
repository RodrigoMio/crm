import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Lead } from '../../leads/entities/lead.entity';

export enum UserProfile {
  ADMIN = 'ADMIN',
  AGENTE = 'AGENTE',
  COLABORADOR = 'COLABORADOR',
}

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  senha: string; // Será hash com bcrypt

  @Column({
    type: 'varchar',
    length: 50,
    default: UserProfile.AGENTE,
  })
  perfil: UserProfile;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  // Campo para colaboradores: referência ao Agente pai
  @Column({ type: 'integer', nullable: true })
  usuario_id_pai: number;

  @ManyToOne(() => User, (user) => user.colaboradores, { nullable: true })
  @JoinColumn({ name: 'usuario_id_pai' })
  usuario_pai: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relacionamento: um usuário pode ter vários leads como vendedor
  @OneToMany(() => Lead, (lead) => lead.vendedor)
  leads: Lead[];

  // Relacionamento: um usuário pode ter vários leads como colaborador
  @OneToMany(() => Lead, (lead) => lead.colaborador)
  leadsColaborador: Lead[];

  // Relacionamento: um Agente pode ter vários colaboradores
  @OneToMany(() => User, (user) => user.usuario_pai)
  colaboradores: User[];
}




