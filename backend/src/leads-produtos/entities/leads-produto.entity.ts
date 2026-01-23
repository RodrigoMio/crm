import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Lead } from '../../leads/entities/lead.entity';
import { Produto } from '../../produtos/entities/produto.entity';

@Entity('leads_produto')
export class LeadsProduto {
  @PrimaryGeneratedColumn({ name: 'leads_produto_id' })
  leads_produto_id: number;

  @Column({ type: 'integer', name: 'leads_id' })
  leads_id: number;

  @ManyToOne(() => Lead)
  @JoinColumn({ name: 'leads_id' })
  lead: Lead;

  @Column({ type: 'integer', name: 'produto_id' })
  produto_id: number;

  @ManyToOne(() => Produto)
  @JoinColumn({ name: 'produto_id' })
  produto: Produto;
}




