import { ImportLeadDto } from './dto/import-lead.dto';
export declare class LeadsImportService {
    processExcelFile(filePath: string): Promise<ImportLeadDto[]>;
    processCsvFile(filePath: string): Promise<ImportLeadDto[]>;
    private validateHeaders;
    private mapExcelDataToLeads;
    private mapCsvDataToLeads;
    private getCellValue;
    private parseArrayValue;
    private parseDate;
    private parseDateString;
    private parseOrigemLead;
}
