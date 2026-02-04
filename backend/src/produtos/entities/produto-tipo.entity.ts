import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('produto_tipo')
export class ProdutoTipo {
  @PrimaryGeneratedColumn({ name: 'produto_tipo_id' })
  produto_tipo_id: number;

  @Column({ type: 'varchar', length: 50 })
  descricao: string;

  @Column({ type: 'varchar', length: 10, name: 'bg_color' })
  bg_color: string;

  @Column({ type: 'varchar', length: 10 })
  color: string;
}
