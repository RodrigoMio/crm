import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { LeadsImportService } from './leads-import.service';
import { Lead } from './entities/lead.entity';
import { User } from '../users/entities/user.entity';
import { Produto } from '../produtos/entities/produto.entity';
import { Ocorrencia } from '../ocorrencias/entities/ocorrencia.entity';
import { LeadOcorrencia } from '../lead-ocorrencias/entities/lead-ocorrencia.entity';
import { LeadsProduto } from '../leads-produtos/entities/leads-produto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, User, Produto, Ocorrencia, LeadOcorrencia, LeadsProduto])],
  controllers: [LeadsController],
  providers: [LeadsService, LeadsImportService],
  exports: [LeadsService],
})
export class LeadsModule {}




