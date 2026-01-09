import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KanbanModelo } from './entities/kanban-modelo.entity';
import { KanbanStatus } from './entities/kanban-status.entity';
import { KanbanModeloStatus } from './entities/kanban-modelo-status.entity';
import { CreateKanbanModeloDto } from './dto/create-kanban-modelo.dto';
import { UpdateKanbanModeloDto } from './dto/update-kanban-modelo.dto';

export interface KanbanModeloWithStatuses {
  kanban_modelo_id: number;
  descricao: string;
  active: boolean;
  statuses: {
    kanban_status_id: number;
    descricao: string;
    bg_color: string;
    text_color: string;
    active: boolean;
  }[];
}

@Injectable()
export class KanbanModelosService {
  constructor(
    @InjectRepository(KanbanModelo)
    private kanbanModeloRepository: Repository<KanbanModelo>,
    @InjectRepository(KanbanStatus)
    private kanbanStatusRepository: Repository<KanbanStatus>,
    @InjectRepository(KanbanModeloStatus)
    private kanbanModeloStatusRepository: Repository<KanbanModeloStatus>,
  ) {}

  /**
   * Lista todos os modelos de kanban com seus status
   * Retorna apenas modelos ativos
   */
  async findAll(): Promise<KanbanModeloWithStatuses[]> {
    const modelos = await this.kanbanModeloRepository.find({
      where: { active: true },
      order: { descricao: 'ASC' },
    });

    // Para cada modelo, busca os status relacionados
    const modelosComStatuses = await Promise.all(
      modelos.map(async (modelo) => {
        const modeloStatuses = await this.kanbanModeloStatusRepository.find({
          where: { kanban_modelo_id: modelo.kanban_modelo_id },
          relations: ['kanbanStatus'],
          order: { kanban_modelo_status_id: 'ASC' },
        });

        const statuses = modeloStatuses
          .map((ms) => ms.kanbanStatus)
          .filter((status) => status && status.active)
          .map((status) => ({
            kanban_status_id: status.kanban_status_id,
            descricao: status.descricao,
            bg_color: status.bg_color || '#ffffff',
            text_color: status.text_color || '#000000',
            active: status.active,
          }));

        return {
          kanban_modelo_id: modelo.kanban_modelo_id,
          descricao: modelo.descricao,
          active: modelo.active,
          statuses,
        };
      }),
    );

    return modelosComStatuses;
  }

  /**
   * Busca um modelo de kanban por ID com seus status
   */
  async findOne(id: number): Promise<KanbanModeloWithStatuses> {
    const modelo = await this.kanbanModeloRepository.findOne({
      where: { kanban_modelo_id: id },
    });

    if (!modelo) {
      throw new NotFoundException('Modelo de kanban não encontrado');
    }

    const modeloStatuses = await this.kanbanModeloStatusRepository.find({
      where: { kanban_modelo_id: id },
      relations: ['kanbanStatus'],
      order: { kanban_modelo_status_id: 'ASC' },
    });

    const statuses = modeloStatuses
      .map((ms) => ms.kanbanStatus)
      .filter((status) => status && status.active)
      .map((status) => ({
        kanban_status_id: status.kanban_status_id,
        descricao: status.descricao,
        bg_color: status.bg_color || '#ffffff',
        text_color: status.text_color || '#000000',
        active: status.active,
      }));

    return {
      kanban_modelo_id: modelo.kanban_modelo_id,
      descricao: modelo.descricao,
      active: modelo.active,
      statuses,
    };
  }

  /**
   * Cria um novo modelo de kanban
   */
  async create(createKanbanModeloDto: CreateKanbanModeloDto): Promise<KanbanModelo> {
    const modelo = this.kanbanModeloRepository.create({
      descricao: createKanbanModeloDto.descricao,
      active: createKanbanModeloDto.active !== undefined ? createKanbanModeloDto.active : true,
    });

    return await this.kanbanModeloRepository.save(modelo);
  }

  /**
   * Atualiza um modelo de kanban
   */
  async update(id: number, updateKanbanModeloDto: UpdateKanbanModeloDto): Promise<KanbanModelo> {
    const modelo = await this.kanbanModeloRepository.findOne({
      where: { kanban_modelo_id: id },
    });

    if (!modelo) {
      throw new NotFoundException('Modelo de kanban não encontrado');
    }

    Object.assign(modelo, updateKanbanModeloDto);
    return await this.kanbanModeloRepository.save(modelo);
  }

  /**
   * Remove um modelo de kanban (soft delete - marca como inativo)
   */
  async remove(id: number): Promise<void> {
    const modelo = await this.kanbanModeloRepository.findOne({
      where: { kanban_modelo_id: id },
    });

    if (!modelo) {
      throw new NotFoundException('Modelo de kanban não encontrado');
    }

    modelo.active = false;
    await this.kanbanModeloRepository.save(modelo);
  }
}





