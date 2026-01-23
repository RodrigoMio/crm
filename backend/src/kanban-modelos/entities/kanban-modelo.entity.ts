import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { KanbanModeloStatus } from './kanban-modelo-status.entity';

@Entity('kanban_modelo')
export class KanbanModelo {
  @PrimaryGeneratedColumn({ name: 'kanban_modelo_id' })
  kanban_modelo_id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  descricao: string;

  @Column({ type: 'boolean', nullable: true, default: true })
  active: boolean;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    name: 'tipo_fluxo',
  })
  tipo_fluxo: 'COMPRADOR' | 'VENDEDOR' | null;

  @OneToMany(() => KanbanModeloStatus, (modeloStatus) => modeloStatus.kanbanModelo)
  modeloStatuses: KanbanModeloStatus[];
}
