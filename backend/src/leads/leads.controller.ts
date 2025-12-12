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
  findAll(@Query() filterDto: FilterLeadsDto, @Request() req) {
    return this.leadsService.findAll(filterDto, req.user);
  }

  /**
   * Busca um lead por ID
   * Admin pode ver qualquer lead
   * Agente só pode ver os seus
   */
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.leadsService.findOne(id, req.user);
  }

  /**
   * Atualiza um lead
   * Admin pode atualizar qualquer lead
   * Agente só pode atualizar os seus
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto, @Request() req) {
    return this.leadsService.update(id, updateLeadDto, req.user);
  }

  /**
   * Remove um lead
   * Admin pode remover qualquer lead
   * Agente só pode remover os seus
   */
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.leadsService.remove(id, req.user);
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
    
    // Obtém linha inicial do body (padrão: 2, pois linha 1 é cabeçalho)
    // Com multipart/form-data, os campos ficam em req.body
    const linhaInicial = req.body?.linhaInicial ? parseInt(req.body.linhaInicial, 10) : 2;
    
    if (linhaInicial < 2) {
      throw new BadRequestException('Linha inicial deve ser maior ou igual a 2 (linha 1 é o cabeçalho)');
    }

    try {
      let leads: any[];

      // Processa o arquivo baseado na extensão
      if (fileExt === '.csv') {
        leads = await this.leadsImportService.processCsvFile(filePath, linhaInicial);
      } else {
        leads = await this.leadsImportService.processExcelFile(filePath, linhaInicial);
      }

      // Importa os leads (linha a linha, para no primeiro erro)
      try {
        const result = await this.leadsService.importLeads(leads, req.user, linhaInicial);

        // Remove o arquivo temporário
        const fs = require('fs');
        fs.unlinkSync(filePath);

        // Retorna sucesso
        return {
          message: `${result.success} leads importados com sucesso.`,
          importedCount: result.success,
          idsIgnorados: result.idsIgnorados || 0,
        };
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




