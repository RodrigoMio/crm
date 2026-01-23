import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { KanbanModelo } from '../../kanban-modelos/entities/kanban-modelo.entity';
import { KanbanStatus } from '../../kanban-modelos/entities/kanban-status.entity';

export enum KanbanBoardType {
  ADMIN = 'ADMIN',
  AGENTE = 'AGENTE',
  COLABORADOR = 'COLABORADOR',
}

@Entity('kanban_boards')
export class KanbanBoard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20 })
  nome: string;

  @Column({ type: 'varchar', length: 7, name: 'cor_hex' })
  cor_hex: string;

  @Column({ type: 'integer', nullable: true, name: 'usuario_id_dono' })
  usuario_id_dono: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'usuario_id_dono' })
  usuario_dono: User;

  @Column({ type: 'integer', nullable: true, name: 'agente_id' })
  agente_id: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'agente_id' })
  agente: User;

  @Column({ type: 'integer', nullable: true, name: 'colaborador_id' })
  colaborador_id: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'colaborador_id' })
  colaborador: User;

  @Column({ type: 'integer', nullable: true, name: 'kanban_modelo_id' })
  kanban_modelo_id: number;

  @ManyToOne(() => KanbanModelo, { nullable: true })
  @JoinColumn({ name: 'kanban_modelo_id' })
  modelo: KanbanModelo;

  @Column({ type: 'integer', default: 0 })
  ordem: number;

  @Column({
    type: 'varchar',
    length: 20,
  })
  tipo: KanbanBoardType;

  @Column({ type: 'integer', nullable: true, name: 'kanban_status_id' })
  kanban_status_id: number;

  @ManyToOne(() => KanbanStatus, { nullable: true })
  @JoinColumn({ name: 'kanban_status_id' })
  kanbanStatus: KanbanStatus;

  @Column({ type: 'integer', name: 'id_usuario_created_at' })
  id_usuario_created_at: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'id_usuario_created_at' })
  usuario_criador: User;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updated_at: Date;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'tipo_fluxo',
  })
  tipo_fluxo: 'COMPRADOR' | 'VENDEDOR' | null;
}
