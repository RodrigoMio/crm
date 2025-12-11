import {
  Entity,
  PrimaryGeneratedColumn,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum LeadStatus {
  NAO_ATENDEU = 'NAO_ATENDEU',
  NAO_E_MOMENTO = 'NAO_E_MOMENTO',
  TEM_INTERESSE = 'TEM_INTERESSE',
  NAO_TEM_INTERESSE = 'NAO_TEM_INTERESSE',
  TELEFONE_INVALIDO = 'TELEFONE_INVALIDO',
  LEAD_QUENTE = 'LEAD_QUENTE',
  RETORNO_AGENDADO = 'RETORNO_AGENDADO',
  NAO_E_PECUARISTA = 'NAO_E_PECUARISTA',
  AGUARDANDO_OFERTAS = 'AGUARDANDO_OFERTAS',
}

export enum ItemInteresse {
  GIR = 'GIR',
  GUZERA = 'GUZERA',
  INDUBRASIL = 'INDUBRASIL',
  SINDI = 'SINDI',
  NELORE = 'NELORE',
  NELORE_MOCHO = 'NELORE_MOCHO',
  TABAPUA = 'TABAPUA',
  BRAHMAN = 'BRAHMAN',
  ANGUS = 'ANGUS',
  GIROLANDO = 'GIROLANDO',
  NELORE_PINTADO = 'NELORE_PINTADO',
  HOLANDES = 'HOLANDES',
  BRANGUS = 'BRANGUS',
}

export enum OrigemLead {
  CAMPANHA_MKT = 'CAMPANHA_MKT',
  HABILITADOS = 'HABILITADOS',
  BASE_RD = 'BASE_RD',
  NETWORKING = 'NETWORKING',
  WHATSAPP = 'WHATSAPP',
  AGENTE_VENDAS = 'AGENTE_VENDAS',
  BASE_CANAL_DO_CAMPO = 'BASE_CANAL_DO_CAMPO',
}

@Entity('leads')
export class Lead {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @Column({ type: 'date' })
  data_entrada: Date;

  @Column({ type: 'varchar', length: 255 })
  nome_razao_social: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nome_fantasia_apelido: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  telefone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  uf: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  municipio: string;

  @Column({ type: 'text', nullable: true })
  anotacoes: string;

  // Status é um array (multiselect)
  // Usa array nativo do PostgreSQL para melhor performance e compatibilidade
  @Column({
    type: 'text',
    array: true,
    nullable: true,
  })
  status: LeadStatus[];

  // Itens de interesse é um array (multiselect)
  // Usa array nativo do PostgreSQL para melhor performance e compatibilidade
  @Column({
    type: 'text',
    array: true,
    nullable: true,
  })
  itens_interesse: ItemInteresse[];

  // Origem é único (single select)
  @Column({
    type: 'enum',
    enum: OrigemLead,
    nullable: true,
  })
  origem_lead: OrigemLead;

  // Vendedor é obrigatório e referencia um usuário Agente
  @Column({ type: 'uuid' })
  vendedor_id: string;

  @ManyToOne(() => User, (user) => user.leads)
  @JoinColumn({ name: 'vendedor_id' })
  vendedor: User;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}




