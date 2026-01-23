import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Lead } from '../../leads/entities/lead.entity';
import { User } from '../../users/entities/user.entity';

export enum OccurrenceType {
  SISTEMA = 'SISTEMA',
  USUARIO = 'USUARIO',
}

@Entity('occurrences')
export class Occurrence {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer', name: 'leads_id' })
  leads_id: number;

  @ManyToOne(() => Lead)
  @JoinColumn({ name: 'leads_id' })
  lead: Lead;

  @Column({ type: 'integer', name: 'usuarios_id' })
  usuarios_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'usuarios_id' })
  usuario: User;

  @Column({ type: 'text' })
  texto: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  tipo: OccurrenceType;

  @Column({
    type: 'enum',
    enum: ['COMPRADOR', 'VENDEDOR'],
    nullable: true,
    name: 'tipo_fluxo'
  })
  tipo_fluxo: 'COMPRADOR' | 'VENDEDOR' | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  created_at: Date;
}
