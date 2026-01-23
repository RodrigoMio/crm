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




