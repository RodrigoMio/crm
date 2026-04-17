import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    create(createUserDto: CreateUserDto, currentUser?: User): Promise<User>;
    findAll(): Promise<User[]>;
    findAgentes(): Promise<User[]>;
    findColaboradores(agenteId?: number, currentUser?: User): Promise<User[]>;
    findOne(id: number): Promise<User>;
    findOneWithRelations(id: number): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<User>;
    deactivate(id: number): Promise<void>;
}
