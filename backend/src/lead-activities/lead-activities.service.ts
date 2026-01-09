import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadOcorrencia } from '../lead-ocorrencias/entities/lead-ocorrencia.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { LeadsService } from '../leads/leads.service';
import { User } from '../users/entities/user.entity';
import { UserProfile } from '../users/entities/user.entity';

@Injectable()
export class LeadActivitiesService {
  constructor(
    @InjectRepository(LeadOcorrencia)
    private leadOcorrenciaRepository: Repository<LeadOcorrencia>,
    private leadsService: LeadsService,
  ) {}

  /**
   * Lista todas as atividades ativas de um lead
   * Verifica permissão de acesso ao lead antes de listar
   * Retorna apenas atividades com active = true
   */
  async findAllByLead(leadId: number, currentUser: User): Promise<LeadOcorrencia[]> {
    try {
      // Verifica se o usuário tem acesso ao lead (lança exceção se não tiver)
      await this.leadsService.findOne(leadId, currentUser);

      // Retorna apenas atividades ativas, ordenadas por data (mais recente primeiro)
      // Se a data for igual, ordena por created_at (mais recente primeiro)
      const activities = await this.leadOcorrenciaRepository.find({
        where: { 
          leads_id: leadId,
          active: true,
        },
        relations: ['ocorrencia', 'produto', 'created_at_usuario'],
        order: { 
          data: 'DESC',
          created_at: 'DESC',
        },
      });

      return activities;
    } catch (error) {
      // Re-lança erros de permissão ou não encontrado
      throw error;
    }
  }

  /**
   * Cria uma nova atividade
   * Verifica permissão de acesso ao lead antes de criar
   */
  async create(
    leadId: number,
    createActivityDto: CreateActivityDto,
    currentUser: User,
  ): Promise<LeadOcorrencia> {
    // Verifica se o usuário tem acesso ao lead
    await this.leadsService.findOne(leadId, currentUser);

    // Normaliza o ID do usuário para garantir que seja number
    const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;

    // Converte a data string para Date
    const dataAtividade = new Date(createActivityDto.data);
    // Remove a hora, mantendo apenas a data
    dataAtividade.setHours(0, 0, 0, 0);

    const activity = this.leadOcorrenciaRepository.create({
      leads_id: leadId,
      ocorrencia_id: createActivityDto.ocorrencia_id,
      produto_id: createActivityDto.produto_id,
      data: dataAtividade,
      active: true,
      created_at_usuarios_id: userId,
    });

    return await this.leadOcorrenciaRepository.save(activity);
  }

  /**
   * Remove uma atividade (soft delete)
   * Apenas o próprio usuário pode remover suas atividades
   * E apenas se foi criada há menos de 1 hora
   * Admin sempre pode remover
   */
  async remove(id: number, currentUser: User): Promise<void> {
    const activity = await this.leadOcorrenciaRepository.findOne({
      where: { lead_ocorrencia_id: id },
      relations: ['created_at_usuario'],
    });

    if (!activity) {
      throw new NotFoundException('Atividade não encontrada');
    }

    // Verifica se a atividade está ativa
    if (!activity.active) {
      throw new NotFoundException('Atividade já foi removida');
    }

    // Admin sempre pode remover
    const isAdmin = currentUser.perfil === UserProfile.ADMIN;

    if (!isAdmin) {
      // Verifica se é do próprio usuário
      if (activity.created_at_usuarios_id !== currentUser.id) {
        throw new ForbiddenException('Você não tem permissão para remover esta atividade');
      }

      // Verifica se foi criada há menos de 1 hora
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      if (activity.created_at < oneHourAgo) {
        throw new ForbiddenException('Apenas atividades criadas há menos de 1 hora podem ser removidas');
      }
    }

    // Normaliza o ID do usuário para garantir que seja number
    const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;

    // Soft delete: atualiza active = false e deleted_at_usuarios_id
    activity.active = false;
    activity.deleted_at_usuarios_id = userId;

    await this.leadOcorrenciaRepository.save(activity);
  }

  /**
   * Verifica se uma atividade pode ser removida pelo usuário atual
   */
  canDelete(activity: LeadOcorrencia, currentUser: User): boolean {
    // Admin sempre pode remover
    if (currentUser.perfil === UserProfile.ADMIN) {
      return true;
    }

    // Verifica se é do próprio usuário
    if (activity.created_at_usuarios_id !== currentUser.id) {
      return false;
    }

    // Verifica se foi criada há menos de 1 hora
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    return activity.created_at >= oneHourAgo;
  }
}

