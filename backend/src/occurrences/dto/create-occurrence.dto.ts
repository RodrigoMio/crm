import { IsString, IsNotEmpty, MaxLength, IsOptional, IsEnum } from 'class-validator';
import { OccurrenceType } from '../entities/occurrence.entity';

export class CreateOccurrenceDto {
  @IsString()
  @IsNotEmpty({ message: 'Texto da ocorrência é obrigatório' })
  @MaxLength(255, { message: 'Texto da ocorrência não pode ter mais de 255 caracteres' })
  texto: string;

  @IsOptional()
  @IsEnum(OccurrenceType)
  tipo?: OccurrenceType;
}






