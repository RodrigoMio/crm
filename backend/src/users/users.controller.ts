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
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Cria um novo usuário
   * Admin pode criar AGENTE e COLABORADOR
   * Agente pode criar COLABORADOR (vinculado a ele)
   */
  @Post()
  create(@Body() createUserDto: CreateUserDto, @Request() req) {
    // Se for criar COLABORADOR, permite Agente também
    if (createUserDto.perfil === 'COLABORADOR') {
      // Agente pode criar colaborador, mas o usuario_id_pai será preenchido automaticamente
      if (req.user.perfil === 'AGENTE') {
        createUserDto.usuario_id_pai = req.user.id;
      }
    } else {
      // Para outros perfis, apenas Admin
      if (req.user.perfil !== 'ADMIN') {
        throw new ForbiddenException('Apenas Admin pode criar usuários AGENTE');
      }
    }
    return this.usersService.create(createUserDto, req.user);
  }

  /**
   * Lista todos os usuários
   * Apenas Admin pode listar
   */
  @Get()
  @UseGuards(AdminGuard)
  findAll() {
    return this.usersService.findAll();
  }

  /**
   * Lista apenas usuários Agente (para seleção em leads)
   * Qualquer usuário autenticado pode ver
   */
  @Get('agentes')
  findAgentes() {
    return this.usersService.findAgentes();
  }

  /**
   * Lista colaboradores
   * Agente vê apenas seus colaboradores
   * Admin pode filtrar por agente_id
   */
  @Get('colaboradores')
  findColaboradores(@Query('agente_id') agenteId?: string, @Request() req?) {
    const agenteIdNumber = agenteId ? parseInt(agenteId, 10) : undefined;
    return this.usersService.findColaboradores(agenteIdNumber, req.user);
  }

  /**
   * Busca informações do usuário logado
   * Qualquer usuário autenticado pode buscar suas próprias informações
   */
  @Get('me')
  findMe(@Request() req) {
    return this.usersService.findOneWithRelations(req.user.id);
  }

  /**
   * Busca um usuário por ID
   * Apenas Admin pode buscar
   */
  @Get(':id')
  @UseGuards(AdminGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  /**
   * Atualiza um usuário
   * Apenas Admin pode atualizar
   */
  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  /**
   * Desativa um usuário
   * Apenas Admin pode desativar
   */
  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.deactivate(id);
  }
}




