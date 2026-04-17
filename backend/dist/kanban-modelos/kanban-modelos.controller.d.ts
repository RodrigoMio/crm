import { KanbanModelosService } from './kanban-modelos.service';
import { CreateKanbanModeloDto } from './dto/create-kanban-modelo.dto';
import { UpdateKanbanModeloDto } from './dto/update-kanban-modelo.dto';
export declare class KanbanModelosController {
    private readonly kanbanModelosService;
    constructor(kanbanModelosService: KanbanModelosService);
    findAll(req: any): Promise<import("./kanban-modelos.service").KanbanModeloWithStatuses[]>;
    findOne(id: number, req: any): Promise<import("./kanban-modelos.service").KanbanModeloWithStatuses>;
    create(createKanbanModeloDto: CreateKanbanModeloDto, req: any): Promise<import("./entities/kanban-modelo.entity").KanbanModelo>;
    update(id: number, updateKanbanModeloDto: UpdateKanbanModeloDto, req: any): Promise<import("./entities/kanban-modelo.entity").KanbanModelo>;
    remove(id: number, req: any): Promise<void>;
}
