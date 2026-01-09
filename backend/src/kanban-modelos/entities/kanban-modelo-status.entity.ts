import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { KanbanModelo } from './kanban-modelo.entity';
import { KanbanStatus } from './kanban-status.entity';

@Entity('kanban_modelo_status')
export class KanbanModeloStatus {
  @PrimaryGeneratedColumn({ name: 'kanban_modelo_status_id' })
  kanban_modelo_status_id: number;

  @Column({ type: 'integer', name: 'kanban_modelo_id' })
  kanban_modelo_id: number;

  @Column({ type: 'integer', name: 'kanban_status_id' })
  kanban_status_id: number;

  @ManyToOne(() => KanbanModelo, (modelo) => modelo.modeloStatuses)
  @JoinColumn({ name: 'kanban_modelo_id' })
  kanbanModelo: KanbanModelo;

  @ManyToOne(() => KanbanStatus, (status) => status.modeloStatuses)
  @JoinColumn({ name: 'kanban_status_id' })
  kanbanStatus: KanbanStatus;
}





