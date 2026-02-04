import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProdutosService } from './produtos.service';
import { CreateProdutoDto } from './dto/create-produto.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('produtos')
@UseGuards(JwtAuthGuard)
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  /**
   * Busca todos os tipos de produto
   * GET /produtos/tipos
   * IMPORTANTE: Esta rota deve vir ANTES de @Get() para evitar conflito
   */
  @Get('tipos')
  async getTipos() {
    return this.produtosService.findAllTipos();
  }

  /**
   * Busca produtos por descrição
   * GET /produtos?search=termo
   */
  @Get()
  async search(@Query('search') search: string) {
    return this.produtosService.search(search || '');
  }

  /**
   * Cria um novo produto
   * Apenas administradores podem criar produtos
   * POST /produtos
   */
  @Post()
  @UseGuards(AdminGuard)
  async create(@Body() createProdutoDto: CreateProdutoDto) {
    return this.produtosService.create(createProdutoDto);
  }
}




