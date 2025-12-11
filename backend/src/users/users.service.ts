import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
   * Apenas Admin pode criar usuários
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verifica se email já existe
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
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
   */
  async findAgentes(): Promise<User[]> {
    return await this.usersRepository.find({
      where: { perfil: UserProfile.AGENTE, ativo: true },
      select: ['id', 'nome', 'email'],
      order: { nome: 'ASC' },
    });
  }

  /**
   * Busca um usuário por ID
   */
  async findOne(id: string): Promise<User> {
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
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
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
  async deactivate(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.ativo = false;
    await this.usersRepository.save(user);
  }
}




