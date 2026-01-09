import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OcorrenciasController } from './ocorrencias.controller';
import { OcorrenciasService } from './ocorrencias.service';
import { Ocorrencia } from './entities/ocorrencia.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ocorrencia])],
  controllers: [OcorrenciasController],
  providers: [OcorrenciasService],
  exports: [OcorrenciasService],
})
export class OcorrenciasModule {}

