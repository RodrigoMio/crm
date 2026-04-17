import { Repository } from 'typeorm';
import { KanbanModelo } from './entities/kanban-modelo.entity';
import { KanbanStatus } from './entities/kanban-status.entity';
import { KanbanModeloStatus } from './entities/kanban-modelo-status.entity';
import { CreateKanbanModeloDto } from './dto/create-kanban-modelo.dto';
import { UpdateKanbanModeloDto } from './dto/update-kanban-modelo.dto';
export interface KanbanModeloWithStatuses {
    kanban_modelo_id: number;
    descricao: string;
    active: boolean;
    tipo_fluxo: 'COMPRADOR' | 'VENDEDOR' | null;
    statuses: {
        kanban_status_id: number;
        descricao: string;
        bg_color: string;
        text_color: string;
        active: boolean;
    }[];
}
export declare class KanbanModelosService {
    private kanbanModeloRepository;
    private kanbanStatusRepository;
    private kanbanModeloStatusRepository;
    constructor(kanbanModeloRepository: Repository<KanbanModelo>, kanbanStatusRepository: Repository<KanbanStatus>, kanbanModeloStatusRepository: Repository<KanbanModeloStatus>);
    findAll(): Promise<KanbanModeloWithStatuses[]>;
    findOne(id: number): Promise<KanbanModeloWithStatuses>;
    create(createKanbanModeloDto: CreateKanbanModeloDto): Promise<KanbanModelo>;
    update(id: number, updateKanbanModeloDto: UpdateKanbanModeloDto): Promise<KanbanModelo>;
    remove(id: number): Promise<void>;
}
