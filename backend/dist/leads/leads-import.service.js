"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadsImportService = void 0;
const common_1 = require("@nestjs/common");
const XLSX = require("xlsx");
const fs = require("fs");
const csv = require("csv-parser");
const lead_entity_1 = require("./entities/lead.entity");
let LeadsImportService = class LeadsImportService {
    async processExcelFile(filePath) {
        try {
            const workbook = XLSX.readFile(filePath);
            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                throw new common_1.BadRequestException('O arquivo Excel não contém abas/guias.');
            }
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            if (!worksheet) {
                throw new common_1.BadRequestException(`A primeira aba "${sheetName}" está vazia ou inválida.`);
            }
            let headers = [];
            try {
                try {
                    const headerRowArray = XLSX.utils.sheet_to_json(worksheet, {
                        header: 1,
                        defval: '',
                        range: '1:1',
                    });
                    if (headerRowArray && headerRowArray.length > 0 && headerRowArray[0]) {
                        const firstRow = headerRowArray[0];
                        headers = firstRow.map((h) => String(h || '').trim()).filter(h => h !== '');
                    }
                }
                catch (rangeError) {
                    console.warn('Erro ao ler cabeçalhos com range, tentando sem range:', rangeError.message);
                }
                if (headers.length === 0) {
                    try {
                        const headerRowArray = XLSX.utils.sheet_to_json(worksheet, {
                            header: 1,
                            defval: '',
                        });
                        if (headerRowArray && headerRowArray.length > 0 && headerRowArray[0]) {
                            const firstRow = headerRowArray[0];
                            headers = firstRow.map((h) => String(h || '').trim()).filter(h => h !== '');
                        }
                    }
                    catch (noRangeError) {
                        console.warn('Erro ao ler cabeçalhos sem range:', noRangeError.message);
                    }
                }
                if (headers.length === 0) {
                    try {
                        if (worksheet['!ref']) {
                            const range = XLSX.utils.decode_range(worksheet['!ref']);
                            headers = [];
                            const maxCol = Math.min(range.e.c, 100);
                            for (let col = range.s.c; col <= maxCol; col++) {
                                const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
                                const cell = worksheet[cellAddress];
                                if (cell && cell.v !== undefined && cell.v !== null) {
                                    const value = String(cell.v).trim();
                                    if (value !== '') {
                                        headers.push(value);
                                    }
                                }
                            }
                        }
                    }
                    catch (directReadError) {
                        console.warn('Erro ao ler cabeçalhos diretamente do worksheet:', directReadError.message);
                    }
                }
                if (headers.length === 0) {
                    try {
                        const sampleData = XLSX.utils.sheet_to_json(worksheet, {
                            defval: '',
                        });
                        if (sampleData && sampleData.length > 0) {
                            headers = Object.keys(sampleData[0] || {}).map(h => String(h).trim()).filter(h => h !== '');
                        }
                    }
                    catch (sampleError) {
                        console.warn('Erro ao ler cabeçalhos como objeto:', sampleError.message);
                    }
                }
            }
            catch (headerError) {
                throw new common_1.BadRequestException(`Erro ao ler cabeçalhos da planilha: ${headerError.message}`);
            }
            if (!headers || headers.length === 0) {
                throw new common_1.BadRequestException({
                    erro: 'Estrutura da planilha inválida',
                    detalhes: 'A planilha não possui cabeçalho válido na primeira linha.',
                    colunasObrigatorias: ['ID', 'Nome ou LEAD', 'Email', 'Telefone', 'Origem do Lead'],
                });
            }
            try {
                this.validateHeaders(headers);
            }
            catch (validationError) {
                throw validationError;
            }
            let data;
            try {
                data = XLSX.utils.sheet_to_json(worksheet, {
                    raw: false,
                    defval: '',
                    blankrows: false,
                });
            }
            catch (error) {
                console.error('Erro ao ler dados da planilha (primeira tentativa):', error.message);
                try {
                    data = XLSX.utils.sheet_to_json(worksheet, {
                        raw: true,
                        defval: null,
                        blankrows: false,
                    });
                }
                catch (fallbackError) {
                    console.error('Erro ao ler dados da planilha (fallback):', fallbackError.message);
                    throw new common_1.BadRequestException(`Erro ao ler dados da planilha: ${error.message}. Erro no fallback: ${fallbackError.message}`);
                }
            }
            if (!data || data.length === 0) {
                throw new common_1.BadRequestException('A primeira aba da planilha está vazia. Verifique se há dados na planilha.');
            }
            if (workbook.SheetNames.length > 1) {
                console.log(`⚠️ Arquivo contém ${workbook.SheetNames.length} abas. Processando apenas a primeira aba: "${sheetName}". As demais abas serão ignoradas.`);
            }
            if (data.length === 0) {
                throw new common_1.BadRequestException('Não há dados para importar na planilha.');
            }
            return this.mapExcelDataToLeads(data);
        }
        catch (error) {
            console.error('Erro ao processar arquivo Excel:', {
                message: error.message,
                stack: error.stack,
                name: error.name,
            });
            if (error.message && (error.message.includes('ID:') || error.message.includes('Linha'))) {
                throw error;
            }
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            if (error.message && error.message.includes('invalid column')) {
                throw new common_1.BadRequestException({
                    erro: 'Erro ao processar arquivo Excel',
                    detalhes: 'Ocorreu um erro ao ler a estrutura da planilha. Verifique se todas as colunas estão preenchidas corretamente e se não há células com erros (#REF!, #N/A, etc.).',
                    erroOriginal: error.message,
                    sugestao: 'Tente salvar a planilha novamente no Excel e verifique se não há fórmulas quebradas ou referências inválidas.',
                });
            }
            throw new common_1.BadRequestException(`Erro ao processar arquivo Excel: ${error.message}`);
        }
    }
    async processCsvFile(filePath) {
        return new Promise((resolve, reject) => {
            const results = [];
            let headers = [];
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('headers', (headerList) => {
                headers = headerList;
                this.validateHeaders(headers);
            })
                .on('data', (data) => results.push(data))
                .on('end', () => {
                try {
                    if (results.length === 0) {
                        reject(new common_1.BadRequestException('Não há dados para importar no arquivo CSV.'));
                        return;
                    }
                    const leads = this.mapCsvDataToLeads(results);
                    resolve(leads);
                }
                catch (error) {
                    reject(error);
                }
            })
                .on('error', (error) => {
                reject(new common_1.BadRequestException(`Erro ao ler arquivo CSV: ${error.message}`));
            });
        });
    }
    validateHeaders(headers) {
        const headersLower = headers.map(h => String(h).toLowerCase().trim());
        const colunasObrigatorias = {
            id: ['id', 'id (coluna a)', '__empty'],
            nome: ['lead', 'nome', 'nome/razão social', 'nome/razao social', 'nome_razao_social'],
            email: ['email', 'e-mail', 'e-mail'],
            telefone: ['telefone', 'tel', 'telefone (lead)'],
            origem: ['origem do lead', 'origem do lead', 'origem', 'origem_lead', 'origem_do_lead', 'origen do lead', 'origem_do_lead'],
        };
        const colunasFaltantes = [];
        const temId = headersLower.some(h => colunasObrigatorias.id.includes(h)) ||
            headers.length > 0;
        if (!temId) {
            colunasFaltantes.push('ID');
        }
        const temNome = headersLower.some(h => colunasObrigatorias.nome.includes(h));
        if (!temNome) {
            colunasFaltantes.push('Nome ou LEAD');
        }
        const temEmail = headersLower.some(h => colunasObrigatorias.email.includes(h));
        if (!temEmail) {
            colunasFaltantes.push('Email');
        }
        const temTelefone = headersLower.some(h => colunasObrigatorias.telefone.includes(h));
        if (!temTelefone) {
            colunasFaltantes.push('Telefone');
        }
        const temOrigem = headersLower.some(h => colunasObrigatorias.origem.includes(h));
        if (!temOrigem) {
            colunasFaltantes.push('Origem do Lead');
        }
        if (colunasFaltantes.length > 0) {
            throw new common_1.BadRequestException({
                erro: 'Estrutura da planilha incompleta',
                detalhes: `A planilha não possui todas as colunas obrigatórias.`,
                colunasFaltantes: colunasFaltantes,
                colunasObrigatorias: ['ID', 'Nome ou LEAD', 'Email', 'Telefone', 'Origem do Lead'],
                colunasEncontradas: headers,
            });
        }
    }
    mapExcelDataToLeads(data) {
        const validRows = data.filter(row => {
            if (!row || typeof row !== 'object')
                return false;
            const keys = Object.keys(row);
            if (keys.length === 0)
                return false;
            return keys.some(key => row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '');
        });
        return validRows.map((row, index) => {
            const rowKeys = Object.keys(row);
            const firstColumnKey = rowKeys[0];
            let idValue = row['ID'] ||
                row['id'] ||
                row['Id'] ||
                row['__EMPTY'] ||
                '';
            if (!idValue && firstColumnKey) {
                idValue = row[firstColumnKey];
            }
            const idValueStr = String(idValue || '').trim();
            let leadId = null;
            if (idValueStr && !isNaN(Number(idValueStr))) {
                leadId = parseInt(idValueStr, 10);
            }
            const lead = {
                id: leadId,
                data_entrada: this.getCellValue(row, ['Data', 'data', 'data_entrada', 'Data Entrada']),
                nome_razao_social: this.getCellValue(row, ['LEAD', 'lead', 'Lead', 'NOME', 'Nome', 'nome', 'Nome/Razão Social', 'nome_razao_social', 'Razão Social', 'razao_social']),
                telefone: this.getCellValue(row, ['Telefone', 'telefone', 'Tel', 'tel']),
                email: this.getCellValue(row, ['Email', 'email', 'E-mail', 'e-mail', 'E-Mail']),
                uf: this.getCellValue(row, ['UF', 'uf', 'Estado', 'estado']),
                municipio: this.getCellValue(row, ['Município', 'municipio', 'Municipio', 'Cidade', 'cidade', 'Município (lead)', 'Municipio (lead)']),
                nome_fantasia_apelido: this.getCellValue(row, ['APELIDO', 'Apelido', 'apelido', 'Nome Fantasia', 'nome_fantasia']),
                anotacoes: this.getCellValue(row, ['Descrição do produto', 'Descrição do Produto', 'descrição do produto', 'Descricao do produto', 'Descrição', 'Anotações', 'anotacoes']),
                ocorrencia: this.getCellValue(row, ['OCORRENCIA', 'Ocorrencia', 'ocorrencia', 'Ocorrência', 'ocorrência']),
                tags: this.getCellValue(row, ['TAGS', 'Tags', 'tags', 'Tag', 'tag']),
                vendedor: this.getCellValue(row, ['Vendedor', 'vendedor', 'Vendedor (lead)', 'Vendedor ID', 'vendedor_id']),
                origem_lead: this.getCellValue(row, ['Origem do Lead', 'Origem do lead', 'origem do lead', 'Origem', 'origem', 'origem_lead', 'ORIGEM_DO_LEAD', 'ORIGEM DO LEAD']),
                total_conversoes: this.getCellValue(row, [
                    'Total Conversões',
                    'Total de conversões',
                    'Total de Conversões',
                    'Total Conversoes',
                    'Total de conversoes',
                    'Total de Conversoes',
                    'total_conversoes',
                    'Total Conversão',
                    'total_conversao',
                    'Total de Conversão',
                    'Total de conversão',
                    'Total Conversao',
                    'Total de Conversao',
                    'Total de conversao',
                ]),
            };
            if (lead.id === null || lead.id === undefined || isNaN(lead.id)) {
                return null;
            }
            if (!lead.nome_razao_social || lead.nome_razao_social.trim() === '') {
                return null;
            }
            if (lead.data_entrada) {
                try {
                    lead.data_entrada = this.parseDate(lead.data_entrada);
                }
                catch (error) {
                    const linhaReal = index + 2;
                    throw new common_1.BadRequestException(`Linha ${linhaReal} (ID: ${lead.id}): ${error.message}`);
                }
            }
            if (!lead.origem_lead || String(lead.origem_lead).trim() === '') {
                return null;
            }
            const origemParsed = this.parseOrigemLead(lead.origem_lead);
            if (!origemParsed) {
                return null;
            }
            lead.origem_lead = origemParsed;
            if (lead.total_conversoes !== undefined && lead.total_conversoes !== null) {
                const totalConversoesValue = String(lead.total_conversoes).trim();
                if (totalConversoesValue.startsWith('#')) {
                    lead.total_conversoes = undefined;
                }
                else if (totalConversoesValue !== '') {
                    const numValue = Number(totalConversoesValue);
                    if (!isNaN(numValue) && isFinite(numValue)) {
                        const intValue = Math.floor(numValue);
                        lead.total_conversoes = intValue;
                    }
                    else {
                        const parsedInt = parseInt(totalConversoesValue, 10);
                        if (!isNaN(parsedInt)) {
                            lead.total_conversoes = parsedInt;
                        }
                        else {
                            lead.total_conversoes = undefined;
                        }
                    }
                }
                else {
                    lead.total_conversoes = undefined;
                }
            }
            else {
                lead.total_conversoes = undefined;
            }
            return lead;
        }).filter((lead) => lead !== null);
    }
    mapCsvDataToLeads(data) {
        return this.mapExcelDataToLeads(data);
    }
    getCellValue(row, possibleNames) {
        for (const name of possibleNames) {
            const value = row[name];
            if (value === undefined || value === null || value === '') {
                continue;
            }
            const strValue = String(value).trim();
            if (strValue.startsWith('#')) {
                continue;
            }
            if (strValue === '') {
                continue;
            }
            return strValue;
        }
        const rowKeys = Object.keys(row);
        const rowKeysLower = rowKeys.map(k => k.toLowerCase().trim());
        for (const name of possibleNames) {
            const nameLower = name.toLowerCase().trim();
            const index = rowKeysLower.indexOf(nameLower);
            if (index !== -1) {
                const actualKey = rowKeys[index];
                const value = row[actualKey];
                if (value === undefined || value === null || value === '') {
                    continue;
                }
                const strValue = String(value).trim();
                if (strValue.startsWith('#')) {
                    continue;
                }
                if (strValue === '') {
                    continue;
                }
                return strValue;
            }
        }
        return undefined;
    }
    parseArrayValue(row, possibleNames) {
        const value = this.getCellValue(row, possibleNames);
        if (!value)
            return undefined;
        return value.split(/[,;|]/).map((item) => item.trim()).filter((item) => item.length > 0);
    }
    parseDate(dateValue) {
        if (!dateValue)
            return undefined;
        if (typeof dateValue === 'string' && dateValue.trim().startsWith('#')) {
            return undefined;
        }
        if (dateValue instanceof Date) {
            if (isNaN(dateValue.getTime())) {
                return undefined;
            }
            return dateValue.toISOString().split('T')[0];
        }
        if (typeof dateValue === 'number') {
            if (isNaN(dateValue) || !isFinite(dateValue)) {
                return undefined;
            }
            return this.parseDateString(String(dateValue));
        }
        return this.parseDateString(String(dateValue));
    }
    parseDateString(dateStr) {
        if (!dateStr || typeof dateStr !== 'string') {
            return undefined;
        }
        const trimmed = dateStr.trim();
        if (trimmed.startsWith('#')) {
            return undefined;
        }
        const dateTimeRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?$/;
        const dateTimeMatch = trimmed.match(dateTimeRegex);
        if (dateTimeMatch) {
            const day = parseInt(dateTimeMatch[1], 10);
            const month = parseInt(dateTimeMatch[2], 10);
            const year = parseInt(dateTimeMatch[3], 10);
            if (day < 1 || day > 31 || month < 1 || month > 12) {
                return undefined;
            }
            const date = new Date(year, month - 1, day);
            if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
                return undefined;
            }
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        const brazilianDateRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
        const match = trimmed.match(brazilianDateRegex);
        if (match) {
            const day = parseInt(match[1], 10);
            const month = parseInt(match[2], 10);
            const year = parseInt(match[3], 10);
            if (day < 1 || day > 31 || month < 1 || month > 12) {
                return undefined;
            }
            const date = new Date(year, month - 1, day);
            if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
                return undefined;
            }
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        const isoDateRegex = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/;
        const isoMatch = trimmed.match(isoDateRegex);
        if (isoMatch) {
            const year = parseInt(isoMatch[1], 10);
            const month = parseInt(isoMatch[2], 10);
            const day = parseInt(isoMatch[3], 10);
            if (day < 1 || day > 31 || month < 1 || month > 12) {
                return undefined;
            }
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        const date = new Date(trimmed);
        if (isNaN(date.getTime())) {
            return undefined;
        }
        return date.toISOString().split('T')[0];
    }
    parseOrigemLead(value) {
        const normalized = value.toUpperCase().trim();
        const origemMap = {
            'CAMPANHA_MKT': lead_entity_1.OrigemLead.CAMPANHA_MKT,
            'CAMPANHA MKT': lead_entity_1.OrigemLead.CAMPANHA_MKT,
            'HABILITADOS': lead_entity_1.OrigemLead.HABILITADOS,
            'BASE_RD': lead_entity_1.OrigemLead.BASE_RD,
            'BASE RD': lead_entity_1.OrigemLead.BASE_RD,
            'NETWORKING': lead_entity_1.OrigemLead.NETWORKING,
            'WHATSAPP': lead_entity_1.OrigemLead.WHATSAPP,
            'AGENTE_VENDAS': lead_entity_1.OrigemLead.AGENTE_VENDAS,
            'AGENTE VENDAS': lead_entity_1.OrigemLead.AGENTE_VENDAS,
            'BASE_CANAL_DO_CAMPO': lead_entity_1.OrigemLead.BASE_CANAL_DO_CAMPO,
            'BASE CANAL DO CAMPO': lead_entity_1.OrigemLead.BASE_CANAL_DO_CAMPO,
        };
        return origemMap[normalized] || null;
    }
};
exports.LeadsImportService = LeadsImportService;
exports.LeadsImportService = LeadsImportService = __decorate([
    (0, common_1.Injectable)()
], LeadsImportService);
//# sourceMappingURL=leads-import.service.js.map