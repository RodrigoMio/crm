"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const bcrypt = require("bcrypt");
let UsersService = class UsersService {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async create(createUserDto, currentUser) {
        const existingUser = await this.usersRepository.findOne({
            where: { email: createUserDto.email },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email já cadastrado');
        }
        if (createUserDto.perfil === user_entity_1.UserProfile.COLABORADOR) {
            if (!createUserDto.usuario_id_pai) {
                throw new common_1.BadRequestException('Colaborador deve ter um Agente pai (usuario_id_pai)');
            }
            const pai = await this.usersRepository.findOne({
                where: { id: createUserDto.usuario_id_pai },
            });
            if (!pai) {
                throw new common_1.NotFoundException('Agente pai não encontrado');
            }
            if (pai.perfil !== user_entity_1.UserProfile.AGENTE) {
                throw new common_1.BadRequestException('Colaborador deve ser vinculado a um Agente');
            }
            if (currentUser && currentUser.perfil === user_entity_1.UserProfile.AGENTE) {
                if (createUserDto.usuario_id_pai !== currentUser.id) {
                    throw new common_1.ForbiddenException('Agente só pode criar colaboradores para si mesmo');
                }
            }
        }
        else {
            if (createUserDto.usuario_id_pai) {
                throw new common_1.BadRequestException('Apenas colaboradores podem ter usuario_id_pai');
            }
        }
        const hashedPassword = await bcrypt.hash(createUserDto.senha, 10);
        const user = this.usersRepository.create({
            ...createUserDto,
            senha: hashedPassword,
        });
        return await this.usersRepository.save(user);
    }
    async findAll() {
        return await this.usersRepository.find({
            select: ['id', 'nome', 'email', 'perfil', 'ativo', 'created_at', 'updated_at'],
            order: { created_at: 'DESC' },
        });
    }
    async findAgentes() {
        return await this.usersRepository.find({
            where: {
                perfil: user_entity_1.UserProfile.AGENTE,
                ativo: true
            },
            select: ['id', 'nome', 'email', 'perfil'],
            order: { nome: 'ASC' },
        });
    }
    async findColaboradores(agenteId, currentUser) {
        const where = {
            perfil: user_entity_1.UserProfile.COLABORADOR,
            ativo: true,
        };
        if (currentUser && currentUser.perfil === user_entity_1.UserProfile.AGENTE) {
            where.usuario_id_pai = currentUser.id;
        }
        else if (agenteId) {
            where.usuario_id_pai = agenteId;
        }
        return await this.usersRepository.find({
            where,
            select: ['id', 'nome', 'email', 'usuario_id_pai', 'ativo', 'created_at', 'updated_at'],
            relations: ['usuario_pai'],
            order: { nome: 'ASC' },
        });
    }
    async findOne(id) {
        const user = await this.usersRepository.findOne({
            where: { id },
            select: ['id', 'nome', 'email', 'perfil', 'ativo', 'created_at', 'updated_at'],
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuário não encontrado');
        }
        return user;
    }
    async findOneWithRelations(id) {
        const user = await this.usersRepository.findOne({
            where: { id },
            select: ['id', 'nome', 'email', 'perfil', 'ativo', 'usuario_id_pai', 'created_at', 'updated_at'],
            relations: ['usuario_pai'],
        });
        if (!user) {
            throw new common_1.NotFoundException('Usuário não encontrado');
        }
        return user;
    }
    async findByEmail(email) {
        return await this.usersRepository.findOne({
            where: { email },
        });
    }
    async update(id, updateUserDto) {
        const user = await this.findOne(id);
        if (updateUserDto.email && updateUserDto.email !== user.email) {
            const existingUser = await this.usersRepository.findOne({
                where: { email: updateUserDto.email },
            });
            if (existingUser) {
                throw new common_1.ConflictException('Email já cadastrado');
            }
        }
        if (updateUserDto.senha) {
            updateUserDto.senha = await bcrypt.hash(updateUserDto.senha, 10);
        }
        Object.assign(user, updateUserDto);
        return await this.usersRepository.save(user);
    }
    async deactivate(id) {
        const user = await this.findOne(id);
        user.ativo = false;
        await this.usersRepository.save(user);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map