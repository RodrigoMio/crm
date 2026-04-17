import { Repository } from 'typeorm';
import { Ocorrencia } from './entities/ocorrencia.entity';
export declare class OcorrenciasService {
    private ocorrenciaRepository;
    constructor(ocorrenciaRepository: Repository<Ocorrencia>);
    findAll(): Promise<Ocorrencia[]>;
}
