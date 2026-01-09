import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KanbanBoardsService } from './kanban-boards.service';
import { KanbanBoardsController } from './kanban-boards.controller';
import { KanbanBoard } from './entities/kanban-board.entity';
import { Lead } from '../leads/entities/lead.entity';
import { User } from '../users/entities/user.entity';
import { KanbanModelo } from '../kanban-modelos/entities/kanban-modelo.entity';
import { KanbanModeloStatus } from '../kanban-modelos/entities/kanban-modelo-status.entity';
import { KanbanStatus } from '../kanban-modelos/entities/kanban-status.entity';
import { Occurrence } from '../occurrences/entities/occurrence.entity';
import { LeadsProduto } from '../leads-produtos/entities/leads-produto.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KanbanBoard,
      Lead,
      User,
      KanbanModelo,
      KanbanModeloStatus,
      KanbanStatus,
      Occurrence,
      LeadsProduto,
    ]),
  ],
  controllers: [KanbanBoardsController],
  providers: [KanbanBoardsService],
  exports: [KanbanBoardsService],
})
export class KanbanBoardsModule {}




