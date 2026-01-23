import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KanbanModelosService } from './kanban-modelos.service';
import { KanbanModelosController } from './kanban-modelos.controller';
import { KanbanModelo } from './entities/kanban-modelo.entity';
import { KanbanStatus } from './entities/kanban-status.entity';
import { KanbanModeloStatus } from './entities/kanban-modelo-status.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([KanbanModelo, KanbanStatus, KanbanModeloStatus]),
  ],
  controllers: [KanbanModelosController],
  providers: [KanbanModelosService],
  exports: [KanbanModelosService],
})
export class KanbanModelosModule {}








