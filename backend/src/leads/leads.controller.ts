import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { FilterLeadsDto } from './dto/filter-leads.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeadsImportService } from './leads-import.service';

@Controller('leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly leadsImportService: LeadsImportService,
  ) {}

  /**
   * Cria um novo lead
   * Admin pode criar para qualquer vendedor
   * Agente só pode criar para si mesmo
   */
  @Post()
  create(@Body() createLeadDto: CreateLeadDto, @Request() req) {
    return this.leadsService.create(createLeadDto, req.user);
  }

  /**
   * Lista leads com filtros
   * Admin vê todos, Agente vê apenas os seus
   */
  @Get()
  findAll(@Query() query: any, @Request() req) {
    // Transforma produtos de string/array para number[]
    // Transforma uf de string/array para string[]
    const filterDto: FilterLeadsDto = {
      ...query,
      produtos: query.produtos 
        ? Array.isArray(query.produtos) 
          ? query.produtos.map((p: string) => parseInt(p, 10))
          : [parseInt(query.produtos, 10)]
        : undefined,
      uf: query.uf
        ? Array.isArray(query.uf)
          ? query.uf
          : [query.uf]
        : undefined,
      vendedor_id: query.vendedor_id ? parseInt(query.vendedor_id, 10) : undefined,
      usuario_id_colaborador: query.usuario_id_colaborador ? parseInt(query.usuario_id_colaborador, 10) : undefined,
      origem_lead: query.origem_lead,
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
    };
    return this.leadsService.findAll(filterDto, req.user);
  }

  /**
   * Retorna o maior ID cadastrado na tabela leads
   * Útil para referência na importação de planilhas
   * IMPORTANTE: Esta rota deve vir ANTES de @Get(':id') para evitar conflito
   */
  @Get('max-id')
  async getMaxId() {
    const maxId = await this.leadsService.getMaxId();
    return { maxId: maxId || 0 };
  }

  /**
   * Busca um lead por ID
   * Admin pode ver qualquer lead
   * Agente só pode ver os seus
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.leadsService.findOne(id, req.user);
  }

  /**
   * Atualiza um lead
   * Admin pode atualizar qualquer lead
   * Agente só pode atualizar os seus
   */
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateLeadDto: UpdateLeadDto, @Request() req) {
    return this.leadsService.update(id, updateLeadDto, req.user);
  }

  /**
   * Remove um lead
   * Admin pode remover qualquer lead
   * Agente só pode remover os seus
   */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.leadsService.remove(id, req.user);
  }

  /**
   * Verifica se o lead tem registro em lead_kanban_status para um tipo_fluxo específico
   */
  @Get(':id/kanban-status/:tipoFluxo')
  checkKanbanStatus(
    @Param('id', ParseIntPipe) id: number,
    @Param('tipoFluxo') tipoFluxo: string,
    @Request() req,
  ) {
    return this.leadsService.checkKanbanStatus(id, tipoFluxo, req.user);
  }

  /**
   * Importa leads de uma planilha (Excel ou CSV)
   * Admin pode importar para qualquer vendedor
   * Agente só pode importar para si mesmo
   */
  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.xlsx', '.xls', '.csv'];
        const ext = extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(ext)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Apenas arquivos Excel (.xlsx, .xls) ou CSV são permitidos'), false);
        }
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
  )
  async importLeads(@UploadedFile() file: any, @Request() req) {
    if (!file) {
      throw new BadRequestException('Arquivo não fornecido');
    }

    const filePath = file.path;
    const fileExt = extname(file.originalname).toLowerCase();
    
    // Obtém ID inicial e final do body (opcional)
    // Com multipart/form-data, os campos ficam em req.body
    const idInicial = req.body?.idInicial ? parseInt(req.body.idInicial, 10) : null;
    const idFinal = req.body?.idFinal ? parseInt(req.body.idFinal, 10) : null;
    
    if (idInicial !== null && (isNaN(idInicial) || idInicial <= 0)) {
      throw new BadRequestException('ID inicial deve ser um número positivo');
    }

    if (idFinal !== null && (isNaN(idFinal) || idFinal <= 0)) {
      throw new BadRequestException('ID final deve ser um número positivo');
    }

    if (idInicial !== null && idFinal !== null && idFinal < idInicial) {
      throw new BadRequestException('ID final deve ser maior ou igual ao ID inicial');
    }

    try {
      let leads: any[];

      // Processa o arquivo baseado na extensão (sem filtro de linha, processa tudo)
      if (fileExt === '.csv') {
        leads = await this.leadsImportService.processCsvFile(filePath);
      } else {
        leads = await this.leadsImportService.processExcelFile(filePath);
      }

      // Filtra por ID se especificado
      if (idInicial !== null || idFinal !== null) {
        leads = leads.filter(lead => {
          if (!lead.id) return false;
          const leadId = typeof lead.id === 'string' ? parseInt(lead.id.trim(), 10) : Number(lead.id);
          if (isNaN(leadId)) return false;
          
          if (idInicial !== null && leadId < idInicial) return false;
          if (idFinal !== null && leadId > idFinal) return false;
          
          return true;
        });
      }

      // Valida se há leads para importar após o processamento
      if (!leads || leads.length === 0) {
        // Remove o arquivo temporário
        const fs = require('fs');
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        
        throw new BadRequestException({
          erro: 'Nenhum lead válido encontrado na planilha. Verifique se os campos obrigatórios (ID e LEAD) estão preenchidos.',
          detalhes: 'Linhas com ID ou LEAD vazios são ignoradas automaticamente.',
        });
      }

      // Importa os leads (linha a linha, para no primeiro erro)
      try {
        const result = await this.leadsService.importLeads(leads, req.user);

        // Remove o arquivo temporário
        const fs = require('fs');
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        // Retorna sucesso com mensagem mais informativa
        let message = '';
        if (result.success === 0 && result.idsIgnorados === 0) {
          message = 'Nenhum lead foi importado. Verifique se os IDs já existem no banco ou se os campos obrigatórios estão preenchidos.';
        } else if (result.success === 0 && result.idsIgnorados > 0) {
          message = `Nenhum lead novo foi importado. ${result.idsIgnorados} ID(s) já existem no banco e foram ignorados.`;
        } else {
          message = `${result.success} lead(s) importado(s) com sucesso.`;
          if (result.idsIgnorados > 0) {
            message += ` ${result.idsIgnorados} ID(s) já existiam e foram ignorados.`;
          }
        }

        // Log para debug
        console.log('✅ Importação concluída:', {
          success: result.success,
          idsIgnorados: result.idsIgnorados,
          message,
        });

        // Retorna resposta de forma explícita
        const response = {
          message,
          importedCount: result.success,
          idsIgnorados: result.idsIgnorados || 0,
        };

        return response;
      } catch (importError) {
        // Remove o arquivo temporário em caso de erro
        const fs = require('fs');
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        
        // Se o erro já contém informações estruturadas (linha, id, erro), propaga como está
        // O erro já inclui o número de linhas importadas (linhasImportadas)
        if (importError instanceof BadRequestException) {
          const errorResponse = importError.getResponse();
          if (typeof errorResponse === 'object' && errorResponse !== null) {
            // Se já tem estrutura de erro (linha, id, erro), propaga
            if ('linha' in errorResponse || 'erro' in errorResponse) {
              throw importError; // Já contém linhasImportadas
            }
          }
        }
        
        throw importError;
      }
    } catch (error) {
      // Remove o arquivo temporário em caso de erro
      const fs = require('fs');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Se o erro já contém informações estruturadas (linha, id, erro), propaga como está
      if (error.response && error.response.message && typeof error.response.message === 'object') {
        throw new BadRequestException(error.response.message);
      }
      
      if (error.message && typeof error.message === 'object' && error.message.linha) {
        throw new BadRequestException(error.message);
      }
      
      // Se é BadRequestException, propaga a mensagem
      if (error instanceof BadRequestException) {
        const errorResponse = error.getResponse();
        if (typeof errorResponse === 'object' && errorResponse !== null) {
          // Se já tem estrutura de erro (linha, id, erro), propaga
          if ('linha' in errorResponse || 'erro' in errorResponse) {
            throw error;
          }
          // Caso contrário, extrai a mensagem
          const message = (errorResponse as any).message || error.message;
          throw new BadRequestException({
            linha: 0,
            id: 'N/A',
            erro: Array.isArray(message) ? message.join(', ') : message,
          });
        }
        throw error;
      }
      
      // Caso contrário, lança erro genérico com estrutura padronizada
      throw new BadRequestException({
        linha: 0,
        id: 'N/A',
        erro: error.message || 'Erro ao processar arquivo. Verifique se a planilha está no formato correto e se a primeira aba contém dados válidos.',
      });
    }
  }
}




