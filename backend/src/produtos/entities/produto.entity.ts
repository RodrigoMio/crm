import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProdutoTipo } from './produto-tipo.entity';

@Entity('produto')
export class Produto {
  @PrimaryGeneratedColumn({ name: 'produto_id' })
  produto_id: number;

  @Column({ type: 'varchar', length: 100 })
  descricao: string;

  @Column({ type: 'integer', name: 'produto_tipo_id', nullable: false, default: 1 })
  produto_tipo_id: number;

  @ManyToOne(() => ProdutoTipo)
  @JoinColumn({ name: 'produto_tipo_id' })
  produto_tipo: ProdutoTipo;
}




