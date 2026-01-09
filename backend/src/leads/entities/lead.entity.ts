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
import { KanbanStatus } from '../../kanban-modelos/entities/kanban-status.entity';

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
  @PrimaryGeneratedColumn()
  id: number;

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

  // Origem é único (single select)
  @Column({
    type: 'enum',
    enum: OrigemLead,
    nullable: true,
  })
  origem_lead: OrigemLead;

  // Vendedor referencia um usuário Agente (pode ser NULL para board "Novos")
  @Column({ type: 'integer', nullable: true })
  vendedor_id: number;

  @ManyToOne(() => User, (user) => user.leads, { nullable: true })
  @JoinColumn({ name: 'vendedor_id' })
  vendedor: User;

  // Colaborador opcional: referencia um usuário Colaborador
  @Column({ type: 'integer', nullable: true })
  usuario_id_colaborador: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'usuario_id_colaborador' })
  colaborador: User;

  // Status do kanban (módulo 3)
  @Column({ type: 'integer', nullable: true, name: 'kanban_status_id' })
  kanban_status_id: number;

  @ManyToOne(() => KanbanStatus, { nullable: true })
  @JoinColumn({ name: 'kanban_status_id' })
  kanbanStatus: KanbanStatus;

  // Total de conversões
  @Column({ type: 'integer', nullable: true, name: 'total_conversoes' })
  total_conversoes: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}




