import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Lead } from '../../leads/entities/lead.entity';
import { Ocorrencia } from '../../ocorrencias/entities/ocorrencia.entity';
import { Produto } from '../../produtos/entities/produto.entity';
import { User } from '../../users/entities/user.entity';

@Entity('lead_ocorrencia')
export class LeadOcorrencia {
  @PrimaryGeneratedColumn({ name: 'lead_ocorrencia_id' })
  lead_ocorrencia_id: number;

  @Column({ type: 'integer', name: 'leads_id' })
  leads_id: number;

  @ManyToOne(() => Lead)
  @JoinColumn({ name: 'leads_id' })
  lead: Lead;

  @Column({ type: 'integer', name: 'ocorrencia_id' })
  ocorrencia_id: number;

  @ManyToOne(() => Ocorrencia)
  @JoinColumn({ name: 'ocorrencia_id' })
  ocorrencia: Ocorrencia;

  @Column({ type: 'integer', name: 'produto_id' })
  produto_id: number;

  @ManyToOne(() => Produto)
  @JoinColumn({ name: 'produto_id' })
  produto: Produto;

  @Column({ type: 'date', nullable: true })
  data: Date;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  created_at: Date;

  @Column({ type: 'integer', name: 'created_at_usuarios_id', nullable: false, default: 1 })
  created_at_usuarios_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_at_usuarios_id' })
  created_at_usuario: User;

  @Column({ type: 'integer', name: 'deleted_at_usuarios_id', nullable: true })
  deleted_at_usuarios_id: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'deleted_at_usuarios_id' })
  deleted_at_usuario: User;
}

