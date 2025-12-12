import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { User, UserProfile } from '../users/entities/user.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { FilterLeadsDto } from './dto/filter-leads.dto';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private leadsRepository: Repository<Lead>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Cria um novo lead
   * Regras:
   * - Admin pode criar qualquer lead
   * - Agente só pode criar leads atribuídos a ele mesmo
   */
  async create(createLeadDto: CreateLeadDto, currentUser: User): Promise<Lead> {
    // Valida se o vendedor existe e é um Agente
    const vendedor = await this.usersRepository.findOne({
      where: { id: createLeadDto.vendedor_id },
    });

    if (!vendedor) {
      throw new NotFoundException('Vendedor não encontrado');
    }

    if (vendedor.perfil !== UserProfile.AGENTE) {
      throw new ForbiddenException('Vendedor deve ser um Agente');
    }

    // Se o usuário é Agente, só pode criar leads para ele mesmo
    if (currentUser.perfil === UserProfile.AGENTE) {
      if (createLeadDto.vendedor_id !== currentUser.id) {
        throw new ForbiddenException('Agente só pode criar leads para si mesmo');
      }
    }

    const lead = this.leadsRepository.create({
      ...createLeadDto,
      data_entrada: createLeadDto.data_entrada || new Date(),
    });

    return await this.leadsRepository.save(lead);
  }

  /**
   * Lista leads com filtros e paginação
   * Regras de visibilidade:
   * - Admin vê todos os leads
   * - Agente vê apenas seus próprios leads
   */
  async findAll(filterDto: FilterLeadsDto, currentUser: User): Promise<{
    data: Lead[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = filterDto.page || 1;
    const limit = filterDto.limit || 100;
    const skip = (page - 1) * limit;

    const queryBuilder = this.leadsRepository
      .createQueryBuilder('lead')
      .leftJoinAndSelect('lead.vendedor', 'vendedor');

    // Regra de visibilidade: Agente só vê seus próprios leads
    if (currentUser.perfil === UserProfile.AGENTE) {
      queryBuilder.where('lead.vendedor_id = :userId', { userId: currentUser.id });
    }

    // Filtro por nome/razão social (busca parcial)
    if (filterDto.nome_razao_social) {
      queryBuilder.andWhere(
        'lead.nome_razao_social ILIKE :nome',
        { nome: `%${filterDto.nome_razao_social}%` },
      );
    }

    // Filtro por status (multiselect - pode ter vários)
    // Cada lead pode ter múltiplos status, então verificamos se algum dos status filtrados está presente
    if (filterDto.status && filterDto.status.length > 0) {
      // Como status é um array PostgreSQL (TEXT[]), usamos o operador && para verificar interseção
      // Isso retorna true se houver pelo menos um status em comum entre o array do lead e o array filtrado
      const statusArray = filterDto.status.map((status) => `'${status.replace(/'/g, "''")}'`).join(',');
      queryBuilder.andWhere(
        `lead.status && ARRAY[${statusArray}]::text[]`,
      );
    }

    // Filtro por UF
    if (filterDto.uf) {
      queryBuilder.andWhere('lead.uf = :uf', { uf: filterDto.uf });
    }

    // Filtro por vendedor (apenas Admin pode filtrar por outro vendedor)
    if (filterDto.vendedor_id) {
      if (currentUser.perfil === UserProfile.AGENTE) {
        // Agente não pode filtrar por outro vendedor
        if (filterDto.vendedor_id !== currentUser.id) {
          throw new ForbiddenException('Agente não pode filtrar por outro vendedor');
        }
      }
      queryBuilder.andWhere('lead.vendedor_id = :vendedorId', { vendedorId: filterDto.vendedor_id });
    }

    queryBuilder.orderBy('lead.created_at', 'DESC');

    // Conta o total de registros
    const total = await queryBuilder.getCount();

    // Aplica paginação
    queryBuilder.skip(skip).take(limit);

    // Busca os dados
    const data = await queryBuilder.getMany();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Busca um lead por ID
   * Regras de visibilidade:
   * - Admin pode ver qualquer lead
   * - Agente só pode ver seus próprios leads
   */
  async findOne(id: string, currentUser: User): Promise<Lead> {
    const lead = await this.leadsRepository.findOne({
      where: { id },
      relations: ['vendedor'],
    });

    if (!lead) {
      throw new NotFoundException('Lead não encontrado');
    }

    // Verifica permissão de visualização
    if (currentUser.perfil === UserProfile.AGENTE) {
      if (lead.vendedor_id !== currentUser.id) {
        throw new ForbiddenException('Você não tem permissão para ver este lead');
      }
    }

    return lead;
  }

  /**
   * Atualiza um lead
   * Regras:
   * - Admin pode atualizar qualquer lead
   * - Agente só pode atualizar seus próprios leads
   */
  async update(id: string, updateLeadDto: UpdateLeadDto, currentUser: User): Promise<Lead> {
    const lead = await this.findOne(id, currentUser);

    // Se estiver atualizando vendedor, valida
    if (updateLeadDto.vendedor_id) {
      const vendedor = await this.usersRepository.findOne({
        where: { id: updateLeadDto.vendedor_id },
      });

      if (!vendedor) {
        throw new NotFoundException('Vendedor não encontrado');
      }

      if (vendedor.perfil !== UserProfile.AGENTE) {
        throw new ForbiddenException('Vendedor deve ser um Agente');
      }

      // Agente não pode transferir lead para outro vendedor
      if (currentUser.perfil === UserProfile.AGENTE) {
        if (updateLeadDto.vendedor_id !== currentUser.id) {
          throw new ForbiddenException('Agente não pode transferir lead para outro vendedor');
        }
      }
    }

    Object.assign(lead, updateLeadDto);
    return await this.leadsRepository.save(lead);
  }

  /**
   * Remove um lead
   * Regras:
   * - Admin pode remover qualquer lead
   * - Agente só pode remover seus próprios leads
   */
  async remove(id: string, currentUser: User): Promise<void> {
    const lead = await this.findOne(id, currentUser);
    await this.leadsRepository.remove(lead);
  }

  /**
   * Importa múltiplos leads de uma planilha
   * Processa linha a linha, com commit individual
   * Para a importação no primeiro erro encontrado
   * Regras:
   * - Admin pode importar para qualquer vendedor
   * - Agente só pode importar para si mesmo
   * - Se ID já existir ou não estiver preenchido, para a importação
   * - Apenas ID e LEAD são obrigatórios
   * @param linhaInicial Linha inicial da planilha (padrão: 2, pois linha 1 é cabeçalho)
   */
  async importLeads(leadsData: any[], currentUser: User, linhaInicial: number = 2): Promise<{ success: number; error: any; idsIgnorados: number }> {
    let success = 0;
    let idsIgnorados = 0;

    for (let i = 0; i < leadsData.length; i++) {
      const leadData = leadsData[i];
      // Calcula o número da linha real na planilha: index + linhaInicial
      const linha = i + linhaInicial;
      
      // Validação: Se ID não estiver preenchido, para a importação
      if (!leadData.id || leadData.id.trim() === '') {
        const error = new BadRequestException({
          linha,
          id: '',
          erro: 'ID não preenchido. Campo ID é obrigatório.',
          linhasImportadas: success, // Informa quantas linhas foram importadas antes do erro
        });
        (error as any).success = success;
        throw error;
      }

      const leadId = leadData.id.trim();
      
      // Valida se o ID não está vazio e tem tamanho razoável
      if (leadId.length === 0) {
        const error = new BadRequestException({
          linha,
          id: leadId,
          erro: 'ID não pode estar vazio',
          linhasImportadas: success,
        });
        (error as any).success = success;
        throw error;
      }
      
      if (leadId.length > 255) {
        const error = new BadRequestException({
          linha,
          id: leadId,
          erro: 'ID não pode ter mais de 255 caracteres',
          linhasImportadas: success,
        });
        (error as any).success = success;
        throw error;
      }

      // Validação: Se ID já existir, ignora e continua
      const existingLead = await this.leadsRepository.findOne({
        where: { id: leadId },
      });

      if (existingLead) {
        // ID já existe, ignora esta linha e continua com a próxima
        idsIgnorados++;
        continue;
      }

      // Busca vendedor por nome (se fornecido) ou usa o ID
      let vendedor: User | null = null;

      if (leadData.vendedor) {
        // Busca vendedor por nome
        const vendedores = await this.usersRepository.find({
          where: { 
            nome: leadData.vendedor,
            perfil: UserProfile.AGENTE,
            ativo: true,
          },
        });

        if (vendedores.length === 0) {
          const error = new BadRequestException({
            linha,
            id: leadId,
            erro: `Vendedor "${leadData.vendedor}" não encontrado`,
            linhasImportadas: success,
          });
          (error as any).success = success;
          throw error;
        }

        if (vendedores.length > 1) {
          const error = new BadRequestException({
            linha,
            id: leadId,
            erro: `Múltiplos vendedores encontrados com o nome "${leadData.vendedor}"`,
            linhasImportadas: success,
          });
          (error as any).success = success;
          throw error;
        }

        vendedor = vendedores[0];
      } else if (leadData.vendedor_id) {
        // Busca vendedor por ID
        vendedor = await this.usersRepository.findOne({
          where: { id: leadData.vendedor_id },
        });
      }

      // Se o usuário é Agente, força o vendedor_id para ser ele mesmo
      if (currentUser.perfil === UserProfile.AGENTE) {
        vendedor = currentUser;
      }

      // Se não encontrou vendedor e não é agente, para a importação
      if (!vendedor && currentUser.perfil === UserProfile.ADMIN) {
        const error = new BadRequestException({
          linha,
          id: leadId,
          erro: 'Vendedor não especificado ou não encontrado',
          linhasImportadas: success,
        });
        (error as any).success = success;
        throw error;
      }

      if (!vendedor) {
        const error = new BadRequestException({
          linha,
          id: leadId,
          erro: 'Vendedor não encontrado',
          linhasImportadas: success,
        });
        (error as any).success = success;
        throw error;
      }

      if (vendedor.perfil !== UserProfile.AGENTE) {
        const error = new BadRequestException({
          linha,
          id: leadId,
          erro: 'Vendedor deve ser um Agente',
          linhasImportadas: success,
        });
        (error as any).success = success;
        throw error;
      }

      // Prepara dados do lead
      const leadToSave: any = {
        id: leadId,
        nome_razao_social: leadData.nome_razao_social.trim(),
        vendedor_id: vendedor.id,
        data_entrada: leadData.data_entrada ? new Date(leadData.data_entrada) : new Date(),
      };

      // Campos opcionais
      if (leadData.telefone) leadToSave.telefone = leadData.telefone.trim();
      if (leadData.email) leadToSave.email = leadData.email.trim();
      if (leadData.anotacoes) leadToSave.anotacoes = leadData.anotacoes.trim();
      
      // UF e Município são opcionais na importação
      if (leadData.uf && leadData.uf.trim()) {
        leadToSave.uf = leadData.uf.trim().substring(0, 2).toUpperCase();
      }
      
      if (leadData.municipio && leadData.municipio.trim()) {
        leadToSave.municipio = leadData.municipio.trim();
      }
      
      if (leadData.status && leadData.status.length > 0) {
        leadToSave.status = leadData.status;
      }
      
      if (leadData.itens_interesse && leadData.itens_interesse.length > 0) {
        leadToSave.itens_interesse = leadData.itens_interesse;
      }
      
      if (leadData.origem_lead) {
        leadToSave.origem_lead = leadData.origem_lead;
      }

      try {
        // Cria e salva o lead (commit individual)
        // O TypeORM Repository.save() já faz commit automático
        const lead = this.leadsRepository.create(leadToSave);
        await this.leadsRepository.save(lead);
        
        // Incrementa o contador de sucesso APÓS o save bem-sucedido
        // Isso garante que a linha foi realmente persistida
        success++;
      } catch (error) {
        // Se houver erro ao salvar, para a importação
        // As linhas anteriores já foram salvas (commit automático do TypeORM)
        // Inclui o número de linhas importadas antes do erro
        const errorWithSuccess = new BadRequestException({
          linha,
          id: leadId,
          erro: error.message || 'Erro ao salvar lead no banco de dados',
          linhasImportadas: success, // Informa quantas linhas foram importadas antes do erro
        });
        (errorWithSuccess as any).success = success; // Adiciona success ao erro para acesso externo
        throw errorWithSuccess;
      }
    }

    return { success, error: null, idsIgnorados };
  }
}

