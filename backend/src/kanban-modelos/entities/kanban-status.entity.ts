import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { KanbanModeloStatus } from './kanban-modelo-status.entity';

@Entity('kanban_status')
export class KanbanStatus {
  @PrimaryGeneratedColumn({ name: 'kanban_status_id' })
  kanban_status_id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  descricao: string;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'bg_color' })
  bg_color: string;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'text_color' })
  text_color: string;

  @Column({ type: 'boolean', nullable: true, default: true })
  active: boolean;

  @OneToMany(() => KanbanModeloStatus, (modeloStatus) => modeloStatus.kanbanStatus)
  modeloStatuses: KanbanModeloStatus[];
}








