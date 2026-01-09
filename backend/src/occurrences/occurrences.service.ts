import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Occurrence, OccurrenceType } from './entities/occurrence.entity';
import { CreateOccurrenceDto } from './dto/create-occurrence.dto';
import { Lead } from '../leads/entities/lead.entity';
import { User } from '../users/entities/user.entity';
import { LeadsService } from '../leads/leads.service';

@Injectable()
export class OccurrencesService {
  constructor(
    @InjectRepository(Occurrence)
    private occurrencesRepository: Repository<Occurrence>,
    private leadsService: LeadsService,
  ) {}

  /**
   * Lista todas as ocorrências de um lead
   * Verifica permissão de acesso ao lead antes de listar
   * Todas as ocorrências são exibidas para usuários que têm acesso ao lead
   */
  async findAllByLead(leadId: number, currentUser: User): Promise<Occurrence[]> {
    try {
      // Verifica se o usuário tem acesso ao lead (lança exceção se não tiver)
      await this.leadsService.findOne(leadId, currentUser);

      // Se tem acesso ao lead, retorna todas as ocorrências
      const occurrences = await this.occurrencesRepository.find({
        where: { leads_id: leadId },
        relations: ['usuario'],
        order: { created_at: 'DESC' },
      });

      return occurrences;
    } catch (error) {
      // Re-lança erros de permissão ou não encontrado
      throw error;
    }
  }

  /**
   * Cria uma nova ocorrência
   * Verifica permissão de acesso ao lead antes de criar
   */
  async create(
    leadId: number,
    createOccurrenceDto: CreateOccurrenceDto,
    currentUser: User,
  ): Promise<Occurrence> {
    // Verifica se o usuário tem acesso ao lead
    await this.leadsService.findOne(leadId, currentUser);

    // Normaliza o ID do usuário para garantir que seja number
    const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id, 10) : currentUser.id;

    const occurrence = this.occurrencesRepository.create({
      leads_id: leadId,
      usuarios_id: userId,
      texto: createOccurrenceDto.texto.trim(),
      tipo: OccurrenceType.USUARIO, // Sempre USUARIO para criações via API
    });

    return await this.occurrencesRepository.save(occurrence);
  }

  /**
   * Remove uma ocorrência
   * Apenas o próprio usuário pode remover suas ocorrências do tipo USUARIO
   * E apenas se foi criada há menos de 1 hora
   */
  async remove(id: number, currentUser: User): Promise<void> {
    const occurrence = await this.occurrencesRepository.findOne({
      where: { id },
      relations: ['usuario'],
    });

    if (!occurrence) {
      throw new NotFoundException('Ocorrência não encontrada');
    }

    // Verifica se é do tipo USUARIO
    if (occurrence.tipo !== OccurrenceType.USUARIO) {
      throw new ForbiddenException('Apenas ocorrências do tipo USUARIO podem ser removidas');
    }

    // Verifica se é do próprio usuário
    if (occurrence.usuarios_id !== currentUser.id) {
      throw new ForbiddenException('Você não tem permissão para remover esta ocorrência');
    }

    // Verifica se foi criada há menos de 1 hora
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    if (occurrence.created_at < oneHourAgo) {
      throw new ForbiddenException('Apenas ocorrências criadas há menos de 1 hora podem ser removidas');
    }

    await this.occurrencesRepository.remove(occurrence);
  }

  /**
   * Verifica se uma ocorrência pode ser removida pelo usuário atual
   */
  canDelete(occurrence: Occurrence, currentUser: User): boolean {
    if (occurrence.tipo !== OccurrenceType.USUARIO) {
      return false;
    }

    if (occurrence.usuarios_id !== currentUser.id) {
      return false;
    }

    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    return occurrence.created_at >= oneHourAgo;
  }
}

