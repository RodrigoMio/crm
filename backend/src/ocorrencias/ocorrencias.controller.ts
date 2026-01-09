import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { OcorrenciasService } from './ocorrencias.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ocorrencias')
@UseGuards(JwtAuthGuard)
export class OcorrenciasController {
  constructor(private readonly ocorrenciasService: OcorrenciasService) {}

  /**
   * Lista todas as ocorrências
   * GET /ocorrencias
   */
  @Get()
  async findAll() {
    return this.ocorrenciasService.findAll();
  }
}

