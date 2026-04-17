import { CreateLeadDto } from './create-lead.dto';
declare const UpdateLeadDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateLeadDto>>;
export declare class UpdateLeadDto extends UpdateLeadDto_base {
    vendedor_id?: number;
    usuario_id_colaborador?: number;
}
export {};
