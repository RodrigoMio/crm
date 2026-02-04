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
  Query,
  Put,
  ForbiddenException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { KanbanBoardsService } from './kanban-boards.service';
import { CreateKanbanBoardDto } from './dto/create-kanban-board.dto';
import { UpdateKanbanBoardDto } from './dto/update-kanban-board.dto';
import { FilterKanbanBoardsDto } from './dto/filter-kanban-boards.dto';
import { MoveLeadDto } from './dto/move-lead.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserProfile } from '../users/entities/user.entity';
import { KanbanBoardType } from './entities/kanban-board.entity';
import { FilterLeadsDto } from '../leads/dto/filter-leads.dto';
import { CreateLeadDto } from '../leads/dto/create-lead.dto';
import { BulkAddProdutoDto, BulkRemoveProdutoDto } from './dto/bulk-produto.dto';

@Controller('kanban-boards')
@UseGuards(JwtAuthGuard)
export class KanbanBoardsController {
  constructor(private readonly kanbanBoardsService: KanbanBoardsService) {}

  /**
   * Módulo 1: Kanban (Admin)
   * Lista boards do tipo ADMIN
   */
  @Get('admin')
  async findAllAdmin(@Query() filterDto: FilterKanbanBoardsDto, @Request() req) {
    if (req.user?.perfil !== UserProfile.ADMIN) {
      throw new ForbiddenException('Apenas administradores podem acessar Kanban Admin');
    }

    return this.kanbanBoardsService.findAll(
      { ...filterDto, tipo: KanbanBoardType.ADMIN },
      req.user,
    );
  }

  /**
   * Módulo 2: Kanban (A)
   * Lista boards do tipo AGENTE
   */
  @Get('agente')
  async findAllAgente(
    @Request() req,
    @Query('agente_id') agenteId?: string,
    @Query('tipo_fluxo') tipoFluxo?: 'COMPRADOR' | 'VENDEDOR',
  ) {
    // Admin ou Agente podem acessar
    if (
      req.user?.perfil !== UserProfile.ADMIN &&
      req.user?.perfil !== UserProfile.AGENTE
    ) {
      throw new ForbiddenException('Apenas Admin ou Agente podem acessar Kanban Agente');
    }

    let agenteIdNumber: number | undefined;
    if (req.user.perfil === UserProfile.ADMIN) {
      // Admin precisa selecionar agente
      if (!agenteId) {
        return []; // Retorna vazio se não selecionou agente
      }
      agenteIdNumber = parseInt(agenteId, 10);
    } else {
      // Agente usa seu próprio ID
      agenteIdNumber = typeof req.user.id === 'string' 
        ? parseInt(req.user.id, 10) 
        : req.user.id;
    }

    return this.kanbanBoardsService.findAll(
      {
        tipo: KanbanBoardType.AGENTE,
        agente_id: agenteIdNumber,
        tipo_fluxo: tipoFluxo,
      },
      req.user,
    );
  }

  /**
   * Módulo 3: Kanban (C)
   * Lista boards do tipo COLABORADOR
   */
  @Get('colaborador')
  async findAllColaborador(
    @Request() req,
    @Query('agente_id') agenteId?: string,
    @Query('colaborador_id') colaboradorId?: string,
    @Query('tipo_fluxo') tipoFluxo?: 'COMPRADOR' | 'VENDEDOR',
  ) {
    // Admin, Agente ou Colaborador podem acessar
    if (
      req.user?.perfil !== UserProfile.ADMIN &&
      req.user?.perfil !== UserProfile.AGENTE &&
      req.user?.perfil !== UserProfile.COLABORADOR
    ) {
      throw new ForbiddenException(
        'Apenas Admin, Agente ou Colaborador podem acessar Kanban Colaborador',
      );
    }

    let colaboradorIdNumber: number | undefined;
    if (req.user.perfil === UserProfile.COLABORADOR) {
      // Colaborador usa seu próprio ID
      colaboradorIdNumber = typeof req.user.id === 'string' 
        ? parseInt(req.user.id, 10) 
        : req.user.id;
    } else if (req.user.perfil === UserProfile.ADMIN || req.user.perfil === UserProfile.AGENTE) {
      // Admin/Agente precisa selecionar colaborador
      if (!colaboradorId) {
        return []; // Retorna vazio se não selecionou colaborador
      }
      colaboradorIdNumber = parseInt(colaboradorId, 10);
    }

    return this.kanbanBoardsService.findAll(
      {
        tipo: KanbanBoardType.COLABORADOR,
        colaborador_id: colaboradorIdNumber,
        tipo_fluxo: tipoFluxo,
      },
      req.user,
    );
  }

  /**
   * Busca um board por ID
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.kanbanBoardsService.findOne(id);
  }

  /**
   * Busca leads de um board com paginação e filtros
   */
  @Get(':id/leads')
  getLeadsByBoard(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Query() query: any,
  ) {
    // Transforma produtos de string/array para number[]
    // Transforma uf de string/array para string[]
    const filterDto: FilterLeadsDto = {
      nome_razao_social: query.nome_razao_social || query.nome, // Aceita ambos para compatibilidade
      email: query.email,
      telefone: query.telefone,
      uf: query.uf
        ? Array.isArray(query.uf)
          ? query.uf
          : [query.uf]
        : undefined,
      vendedor_id: query.vendedor_id ? parseInt(query.vendedor_id, 10) : undefined,
      usuario_id_colaborador: query.usuario_id_colaborador ? parseInt(query.usuario_id_colaborador, 10) : undefined,
      origem_lead: query.origem_lead,
      produtos: query.produtos 
        ? Array.isArray(query.produtos) 
          ? query.produtos.map((p: string) => parseInt(p, 10))
          : [parseInt(query.produtos, 10)]
        : undefined,
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 50,
    };
    return this.kanbanBoardsService.getLeadsByBoard(
      id,
      filterDto,
      req.user,
    );
  }

  /**
   * Exporta leads de um board para Excel
   */
  @Get(':id/leads/export')
  async exportLeadsByBoard(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
    @Query() query: any,
    @Res() res: Response,
  ) {
    // Transforma produtos de string/array para number[]
    // Transforma uf de string/array para string[]
    const filterDto: FilterLeadsDto = {
      nome_razao_social: query.nome_razao_social || query.nome,
      email: query.email,
      telefone: query.telefone,
      uf: query.uf
        ? Array.isArray(query.uf)
          ? query.uf
          : [query.uf]
        : undefined,
      vendedor_id: query.vendedor_id ? parseInt(query.vendedor_id, 10) : undefined,
      usuario_id_colaborador: query.usuario_id_colaborador ? parseInt(query.usuario_id_colaborador, 10) : undefined,
      origem_lead: query.origem_lead,
      produtos: query.produtos 
        ? Array.isArray(query.produtos) 
          ? query.produtos.map((p: string) => parseInt(p, 10))
          : [parseInt(query.produtos, 10)]
        : undefined,
    };

    const board = await this.kanbanBoardsService.findOne(id);
    const excelBuffer = await this.kanbanBoardsService.exportLeadsByBoard(
      id,
      filterDto,
      req.user,
    );

    // Nome do arquivo: leads-{nome-do-board}.xlsx
    const fileName = `leads-${board.nome.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(excelBuffer);
  }

  /**
   * Cria um novo board
   */
  @Post()
  create(@Body() createKanbanBoardDto: CreateKanbanBoardDto, @Request() req) {
    return this.kanbanBoardsService.create(createKanbanBoardDto, req.user);
  }

  /**
   * Cria um lead e associa diretamente a um board
   */
  @Post(':boardId/leads')
  createLeadInBoard(
    @Param('boardId', ParseIntPipe) boardId: number,
    @Body() createLeadDto: CreateLeadDto,
    @Request() req,
  ) {
    return this.kanbanBoardsService.createLeadInBoard(boardId, createLeadDto, req.user);
  }

  /**
   * Move um lead de um board para outro
   */
  @Post('leads/:leadId/move')
  moveLead(
    @Param('leadId', ParseIntPipe) leadId: number,
    @Body() moveLeadDto: MoveLeadDto,
    @Request() req,
  ) {
    return this.kanbanBoardsService.moveLead(
      leadId,
      moveLeadDto.from_board_id,
      moveLeadDto.to_board_id,
      req.user,
    );
  }

  /**
   * Atualiza ordem dos boards
   */
  @Put('order/:tipo')
  updateOrder(
    @Param('tipo') tipo: KanbanBoardType,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.kanbanBoardsService.updateOrder(updateOrderDto.board_ids, tipo);
  }

  /**
   * Atualiza um board
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateKanbanBoardDto: UpdateKanbanBoardDto,
    @Request() req,
  ) {
    return this.kanbanBoardsService.update(id, updateKanbanBoardDto, req.user);
  }

  /**
   * Remove um board (apenas se vazio)
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.kanbanBoardsService.remove(id, req.user);
  }

  /**
   * Adiciona produto (tag) para todos os leads visíveis de um board
   * POST /kanban-boards/:boardId/leads/bulk-add-produto
   */
  @Post(':boardId/leads/bulk-add-produto')
  bulkAddProduto(
    @Param('boardId', ParseIntPipe) boardId: number,
    @Body() bulkAddProdutoDto: BulkAddProdutoDto,
    @Request() req,
    @Query() query: any,
  ) {
    // Transforma filtros de query para FilterLeadsDto
    const filterDto: FilterLeadsDto = {
      nome_razao_social: query.nome_razao_social || query.nome,
      email: query.email,
      telefone: query.telefone,
      uf: query.uf
        ? Array.isArray(query.uf)
          ? query.uf
          : [query.uf]
        : undefined,
      vendedor_id: query.vendedor_id ? parseInt(query.vendedor_id, 10) : undefined,
      usuario_id_colaborador: query.usuario_id_colaborador ? parseInt(query.usuario_id_colaborador, 10) : undefined,
      origem_lead: query.origem_lead,
      produtos: query.produtos 
        ? Array.isArray(query.produtos) 
          ? query.produtos.map((p: string) => parseInt(p, 10))
          : [parseInt(query.produtos, 10)]
        : undefined,
    };

    return this.kanbanBoardsService.bulkAddProduto(
      boardId,
      bulkAddProdutoDto,
      filterDto,
      req.user,
    );
  }

  /**
   * Remove produto (tag) de todos os leads visíveis de um board
   * DELETE /kanban-boards/:boardId/leads/bulk-remove-produto
   */
  @Delete(':boardId/leads/bulk-remove-produto')
  bulkRemoveProduto(
    @Param('boardId', ParseIntPipe) boardId: number,
    @Body() bulkRemoveProdutoDto: BulkRemoveProdutoDto,
    @Request() req,
    @Query() query: any,
  ) {
    // Transforma filtros de query para FilterLeadsDto
    const filterDto: FilterLeadsDto = {
      nome_razao_social: query.nome_razao_social || query.nome,
      email: query.email,
      telefone: query.telefone,
      uf: query.uf
        ? Array.isArray(query.uf)
          ? query.uf
          : [query.uf]
        : undefined,
      vendedor_id: query.vendedor_id ? parseInt(query.vendedor_id, 10) : undefined,
      usuario_id_colaborador: query.usuario_id_colaborador ? parseInt(query.usuario_id_colaborador, 10) : undefined,
      origem_lead: query.origem_lead,
      produtos: query.produtos 
        ? Array.isArray(query.produtos) 
          ? query.produtos.map((p: string) => parseInt(p, 10))
          : [parseInt(query.produtos, 10)]
        : undefined,
    };

    return this.kanbanBoardsService.bulkRemoveProduto(
      boardId,
      bulkRemoveProdutoDto,
      filterDto,
      req.user,
    );
  }
}

