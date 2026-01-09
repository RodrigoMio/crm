import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('ocorrencia')
export class Ocorrencia {
  @PrimaryGeneratedColumn({ name: 'ocorrencia_id' })
  ocorrencia_id: number;

  @Column({ type: 'varchar', length: 50 })
  descricao: string;
}

