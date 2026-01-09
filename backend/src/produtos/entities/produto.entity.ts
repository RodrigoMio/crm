import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('produto')
export class Produto {
  @PrimaryGeneratedColumn({ name: 'produto_id' })
  produto_id: number;

  @Column({ type: 'varchar', length: 100 })
  descricao: string;
}

