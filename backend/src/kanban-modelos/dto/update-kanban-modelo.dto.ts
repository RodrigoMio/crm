import { PartialType } from '@nestjs/mapped-types';
import { CreateKanbanModeloDto } from './create-kanban-modelo.dto';

export class UpdateKanbanModeloDto extends PartialType(CreateKanbanModeloDto) {}








