import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserProfile } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Cria um novo usuário
   * Admin pode criar AGENTE e COLABORADOR
   * Agente pode criar COLABORADOR (vinculado a ele)
   */
  async create(createUserDto: CreateUserDto, currentUser?: User): Promise<User> {
    // Verifica se email já existe
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    // Validações específicas para COLABORADOR
    if (createUserDto.perfil === UserProfile.COLABORADOR) {
      if (!createUserDto.usuario_id_pai) {
        throw new BadRequestException('Colaborador deve ter um Agente pai (usuario_id_pai)');
      }

      // Verifica se o pai existe e é um Agente
      const pai = await this.usersRepository.findOne({
        where: { id: createUserDto.usuario_id_pai },
      });

      if (!pai) {
        throw new NotFoundException('Agente pai não encontrado');
      }

      if (pai.perfil !== UserProfile.AGENTE) {
        throw new BadRequestException('Colaborador deve ser vinculado a um Agente');
      }

      // Se o usuário atual é Agente, só pode criar colaborador para si mesmo
      if (currentUser && currentUser.perfil === UserProfile.AGENTE) {
        if (createUserDto.usuario_id_pai !== currentUser.id) {
          throw new ForbiddenException('Agente só pode criar colaboradores para si mesmo');
        }
      }
    } else {
      // Se não é COLABORADOR, não deve ter usuario_id_pai
      if (createUserDto.usuario_id_pai) {
        throw new BadRequestException('Apenas colaboradores podem ter usuario_id_pai');
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(createUserDto.senha, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      senha: hashedPassword,
    });

    return await this.usersRepository.save(user);
  }

  /**
   * Lista todos os usuários
   * Apenas Admin pode listar todos
   */
  async findAll(): Promise<User[]> {
    return await this.usersRepository.find({
      select: ['id', 'nome', 'email', 'perfil', 'ativo', 'created_at', 'updated_at'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Lista apenas usuários Agente (para seleção em leads)
   * Filtra explicitamente por perfil = 'AGENTE' e ativo = true
   */
  async findAgentes(): Promise<User[]> {
    return await this.usersRepository.find({
      where: { 
        perfil: UserProfile.AGENTE, 
        ativo: true 
      },
      select: ['id', 'nome', 'email', 'perfil'],
      order: { nome: 'ASC' },
    });
  }

  /**
   * Lista colaboradores de um Agente específico
   * Se currentUser for Agente, retorna apenas seus colaboradores
   * Se currentUser for Admin, pode filtrar por agente_id
   */
  async findColaboradores(agenteId?: number, currentUser?: User): Promise<User[]> {
    const where: any = {
      perfil: UserProfile.COLABORADOR,
      ativo: true,
    };

    // Se o usuário atual é Agente, só pode ver seus próprios colaboradores
    if (currentUser && currentUser.perfil === UserProfile.AGENTE) {
      where.usuario_id_pai = currentUser.id;
    } else if (agenteId) {
      // Admin pode filtrar por agente_id
      where.usuario_id_pai = agenteId;
    }

    return await this.usersRepository.find({
      where,
      select: ['id', 'nome', 'email', 'usuario_id_pai', 'ativo', 'created_at', 'updated_at'],
      relations: ['usuario_pai'],
      order: { nome: 'ASC' },
    });
  }

  /**
   * Busca um usuário por ID
   */
  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'nome', 'email', 'perfil', 'ativo', 'created_at', 'updated_at'],
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  /**
   * Busca um usuário por ID com relações (usuario_pai)
   */
  async findOneWithRelations(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'nome', 'email', 'perfil', 'ativo', 'usuario_id_pai', 'created_at', 'updated_at'],
      relations: ['usuario_pai'],
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  /**
   * Busca um usuário por email (para autenticação)
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: { email },
    });
  }

  /**
   * Atualiza um usuário
   * Apenas Admin pode atualizar
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Se estiver atualizando email, verifica duplicidade
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email já cadastrado');
      }
    }

    // Se estiver atualizando senha, faz hash
    if (updateUserDto.senha) {
      updateUserDto.senha = await bcrypt.hash(updateUserDto.senha, 10);
    }

    Object.assign(user, updateUserDto);
    return await this.usersRepository.save(user);
  }

  /**
   * Desativa um usuário (soft delete)
   * Apenas Admin pode desativar
   */
  async deactivate(id: number): Promise<void> {
    const user = await this.findOne(id);
    user.ativo = false;
    await this.usersRepository.save(user);
  }
}




