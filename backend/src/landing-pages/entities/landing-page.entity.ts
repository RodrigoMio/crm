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

export type TipoFluxo = 'VENDEDOR' | 'COMPRADOR';

@Entity('landing_pages')
export class LandingPage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  titulo: string;

  @Column({ type: 'varchar', length: 255 })
  texto_principal: string;

  @Column({ type: 'integer', default: 24 })
  font_size_principal: number;

  @Column({ type: 'integer', default: 12 })
  font_size_secundaria: number;

  @Column({ type: 'text' })
  texto_secundario: string;

  @Column({ type: 'varchar', length: 10, default: '#4A4A4A' })
  background_color: string;

  @Column({ type: 'varchar', length: 10, default: '#72EDED' })
  font_color_primary: string;

  @Column({ type: 'varchar', length: 10, default: '#FFFFFF' })
  font_color_secondary: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  token: string;

  @Column({ type: 'integer', nullable: true })
  vendedor_id: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'vendedor_id' })
  vendedor: User | null;

  @Column({ type: 'integer', nullable: true })
  usuario_id_colaborador: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'usuario_id_colaborador' })
  colaborador: User | null;

  @Column({ type: 'integer', nullable: true })
  kanban_status_id: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  tipo_fluxo: TipoFluxo | null;

  @Column({ type: 'text', nullable: true })
  dominio_autorizado: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

