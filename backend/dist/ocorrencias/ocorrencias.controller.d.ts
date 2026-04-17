import { OcorrenciasService } from './ocorrencias.service';
export declare class OcorrenciasController {
    private readonly ocorrenciasService;
    constructor(ocorrenciasService: OcorrenciasService);
    findAll(): Promise<import("./entities/ocorrencia.entity").Ocorrencia[]>;
}
