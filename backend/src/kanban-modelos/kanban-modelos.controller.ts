import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { KanbanModelosService } from './kanban-modelos.service';
import { CreateKanbanModeloDto } from './dto/create-kanban-modelo.dto';
import { UpdateKanbanModeloDto } from './dto/update-kanban-modelo.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserProfile } from '../users/entities/user.entity';

@Controller('kanban-modelos')
@UseGuards(JwtAuthGuard)
export class KanbanModelosController {
  constructor(private readonly kanbanModelosService: KanbanModelosService) {}

  /**
   * Lista todos os modelos de kanban com seus status
   * ADMIN e AGENTE podem listar (para uso na criação de boards)
   */
  @Get()
  findAll(@Request() req) {
    // ADMIN e AGENTE podem listar modelos
    if (
      req.user?.perfil !== UserProfile.ADMIN &&
      req.user?.perfil !== UserProfile.AGENTE
    ) {
      throw new ForbiddenException('Apenas administradores e agentes podem acessar modelos de kanban');
    }
    return this.kanbanModelosService.findAll();
  }

  /**
   * Busca um modelo de kanban por ID
   * Apenas ADMIN pode acessar
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    // Verifica se é ADMIN
    if (req.user?.perfil !== UserProfile.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem acessar modelos de kanban');
    }
    return this.kanbanModelosService.findOne(id);
  }

  /**
   * Cria um novo modelo de kanban
   * Apenas ADMIN pode criar
   */
  @Post()
  create(@Body() createKanbanModeloDto: CreateKanbanModeloDto, @Request() req) {
    // Verifica se é ADMIN
    if (req.user?.perfil !== UserProfile.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem criar modelos de kanban');
    }
    return this.kanbanModelosService.create(createKanbanModeloDto);
  }

  /**
   * Atualiza um modelo de kanban
   * Apenas ADMIN pode atualizar
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateKanbanModeloDto: UpdateKanbanModeloDto,
    @Request() req,
  ) {
    // Verifica se é ADMIN
    if (req.user?.perfil !== UserProfile.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem atualizar modelos de kanban');
    }
    return this.kanbanModelosService.update(id, updateKanbanModeloDto);
  }

  /**
   * Remove um modelo de kanban
   * Apenas ADMIN pode remover
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    // Verifica se é ADMIN
    if (req.user?.perfil !== UserProfile.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem remover modelos de kanban');
    }
    return this.kanbanModelosService.remove(id);
  }
}

