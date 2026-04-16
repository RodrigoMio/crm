import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column } from 'typeorm';
import { LandingPage } from './landing-page.entity';
import { Produto } from '../../produtos/entities/produto.entity';

@Entity('landing_pages_produto')
export class LandingPageProduto {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  landing_page_id: number;

  @Column({ type: 'int' })
  produto_id: number;

  @ManyToOne(() => LandingPage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'landing_page_id' })
  landing_page: LandingPage;

  @ManyToOne(() => Produto, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'produto_id' })
  produto: Produto;
}

