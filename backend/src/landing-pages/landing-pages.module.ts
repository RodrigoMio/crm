import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LandingPage } from './entities/landing-page.entity';
import { LandingPageProduto } from './entities/landing-page-produto.entity';
import { LandingPagesService } from './landing-pages.service';
import { LandingPagesController } from './landing-pages.controller';
import { LandingPagesPublicController } from './landing-pages-public.controller';
import { User } from '../users/entities/user.entity';
import { Lead } from '../leads/entities/lead.entity';
import { Produto } from '../produtos/entities/produto.entity';
import { LeadsProduto } from '../leads-produtos/entities/leads-produto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LandingPage, LandingPageProduto, Produto, LeadsProduto, User, Lead])],
  controllers: [LandingPagesController, LandingPagesPublicController],
  providers: [LandingPagesService],
  exports: [LandingPagesService],
})
export class LandingPagesModule {}

