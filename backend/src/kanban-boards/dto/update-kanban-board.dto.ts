import { PartialType } from '@nestjs/mapped-types';
import { CreateKanbanBoardDto } from './create-kanban-board.dto';

export class UpdateKanbanBoardDto extends PartialType(CreateKanbanBoardDto) {}







