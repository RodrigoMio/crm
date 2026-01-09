import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LeadsModule } from './leads/leads.module';
import { OccurrencesModule } from './occurrences/occurrences.module';
import { KanbanModelosModule } from './kanban-modelos/kanban-modelos.module';
import { KanbanBoardsModule } from './kanban-boards/kanban-boards.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ProdutosModule } from './produtos/produtos.module';
import { LeadActivitiesModule } from './lead-activities/lead-activities.module';
import { OcorrenciasModule } from './ocorrencias/ocorrencias.module';
import { DatabaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    AuthModule,
    UsersModule,
    LeadsModule,
    OccurrencesModule,
    KanbanModelosModule,
    KanbanBoardsModule,
    AppointmentsModule,
    ProdutosModule,
    LeadActivitiesModule,
    OcorrenciasModule,
  ],
})
export class AppModule {}




