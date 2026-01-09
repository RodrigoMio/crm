import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ocorrencia } from './entities/ocorrencia.entity';

@Injectable()
export class OcorrenciasService {
  constructor(
    @InjectRepository(Ocorrencia)
    private ocorrenciaRepository: Repository<Ocorrencia>,
  ) {}

  /**
   * Busca todas as ocorrências ordenadas por descrição
   */
  async findAll(): Promise<Ocorrencia[]> {
    return this.ocorrenciaRepository.find({
      order: {
        descricao: 'ASC',
      },
    });
  }
}

