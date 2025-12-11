import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import { LeadStatus, ItemInteresse, OrigemLead } from './entities/lead.entity';
import { ImportLeadDto } from './dto/import-lead.dto';

@Injectable()
export class LeadsImportService {
  /**
   * Processa arquivo Excel (.xlsx, .xls)
   * Processa APENAS a primeira aba/guia da planilha
   */
  async processExcelFile(filePath: string): Promise<ImportLeadDto[]> {
    try {
      const workbook = XLSX.readFile(filePath);
      
      // Valida se o arquivo tem pelo menos uma aba
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new BadRequestException('O arquivo Excel não contém abas/guias.');
      }

      // Processa APENAS a primeira aba (índice 0)
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      if (!worksheet) {
        throw new BadRequestException(`A primeira aba "${sheetName}" está vazia ou inválida.`);
      }

      // Lê como JSON (primeira linha como cabeçalho)
      const data = XLSX.utils.sheet_to_json(worksheet, { 
        raw: false,
        defval: '', // Valor padrão para células vazias
      });

      // Valida se há dados na planilha
      if (!data || data.length === 0) {
        throw new BadRequestException('A primeira aba da planilha está vazia. Verifique se há dados na planilha.');
      }

      // Informa quantas abas foram ignoradas (se houver mais de uma)
      if (workbook.SheetNames.length > 1) {
        console.log(`⚠️ Arquivo contém ${workbook.SheetNames.length} abas. Processando apenas a primeira aba: "${sheetName}". As demais abas serão ignoradas.`);
      }

      return this.mapExcelDataToLeads(data);
    } catch (error) {
      // Se o erro já contém informações sobre ID e linha, propaga como está
      if (error.message && (error.message.includes('ID:') || error.message.includes('Linha'))) {
        throw error;
      }
      
      // Se já é um BadRequestException, propaga
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(`Erro ao processar arquivo Excel: ${error.message}`);
    }
  }

  /**
   * Processa arquivo CSV
   */
  async processCsvFile(filePath: string): Promise<ImportLeadDto[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          try {
            const leads = this.mapCsvDataToLeads(results);
            resolve(leads);
          } catch (error) {
            reject(new BadRequestException(`Erro ao processar arquivo CSV: ${error.message}`));
          }
        })
        .on('error', (error) => {
          reject(new BadRequestException(`Erro ao ler arquivo CSV: ${error.message}`));
        });
    });
  }

  /**
   * Mapeia dados do Excel para DTOs de Lead
   * Mapeamento:
   * - Coluna A (primeira coluna): id do lead
   * - Data: data_entrada
   * - LEAD: nome_razao_social (obrigatório)
   * - Telefone: telefone
   * - Email: email
   * - UF: uf
   * - Município: municipio
   * - Raça: itens_interesse (adicionar ao array)
   * - Descrição do produto: anotacoes
   * - Situacao: status (adicionar ao array)
   * - Vendedor: vendedor_id (buscar por nome)
   * - Origem do Lead: origem_lead
   */
  private mapExcelDataToLeads(data: any[]): ImportLeadDto[] {
    return data.map((row, index) => {
      // Obtém o ID da primeira coluna
      // A primeira coluna pode vir como 'ID', 'id', 'Id', ou como primeira chave do objeto
      const rowKeys = Object.keys(row);
      const firstColumnKey = rowKeys[0];
      
      // Tenta diferentes nomes possíveis para a primeira coluna
      const idValue = 
        row['ID'] || 
        row['id'] || 
        row['Id'] || 
        row['__EMPTY'] || // XLSX pode usar __EMPTY para colunas sem nome
        (firstColumnKey && row[firstColumnKey]) || 
        '';

      const leadId = String(idValue).trim();

      const lead: any = {
        // Primeira coluna = ID (Coluna A)
        id: leadId,
        
        // Data = data_entrada
        data_entrada: this.getCellValue(row, ['Data', 'data', 'data_entrada', 'Data Entrada']),
        
        // LEAD = nome_razao_social (obrigatório)
        nome_razao_social: this.getCellValue(row, ['LEAD', 'lead', 'Lead', 'Nome/Razão Social', 'nome_razao_social']),
        
        // Telefone = telefone
        telefone: this.getCellValue(row, ['Telefone', 'telefone', 'Tel', 'tel']),
        
        // Email = email
        email: this.getCellValue(row, ['Email', 'email', 'E-mail', 'e-mail', 'E-Mail']),
        
        // UF = uf
        uf: this.getCellValue(row, ['UF', 'uf', 'Estado', 'estado']),
        
        // Município = municipio
        municipio: this.getCellValue(row, ['Município', 'municipio', 'Municipio', 'Cidade', 'cidade', 'Município (lead)', 'Municipio (lead)']),
        
        // Raça = itens_interesse (adicionar ao array)
        raca: this.getCellValue(row, ['Raça', 'raca', 'Raca', 'raça', 'Raça (lead)']),
        
        // Descrição do produto = anotacoes
        anotacoes: this.getCellValue(row, ['Descrição do produto', 'Descrição do Produto', 'descrição do produto', 'Descricao do produto', 'Descrição', 'Anotações', 'anotacoes']),
        
        // Situacao = status (adicionar ao array)
        situacao: this.getCellValue(row, ['Situacao', 'situacao', 'Situação', 'situação', 'Status', 'status']),
        
        // Vendedor = vendedor_id (buscar por nome)
        vendedor: this.getCellValue(row, ['Vendedor', 'vendedor', 'Vendedor (lead)', 'Vendedor ID', 'vendedor_id']),
        
        // Origem do Lead = origem_lead
        origem_lead: this.getCellValue(row, ['Origem do Lead', 'Origem do lead', 'origem do lead', 'Origem', 'origem', 'origem_lead']),
      };

      // Valida campos obrigatórios: apenas ID e LEAD
      if (!lead.id || lead.id.trim() === '') {
        // Se ID não estiver preenchido, retorna null para desconsiderar
        return null;
      }

      if (!lead.nome_razao_social || lead.nome_razao_social.trim() === '') {
        // Se LEAD não estiver preenchido, retorna null para desconsiderar
        return null;
      }

      // Converte data - captura erro e inclui ID
      if (lead.data_entrada) {
        try {
          lead.data_entrada = this.parseDate(lead.data_entrada);
        } catch (error) {
          // Propaga erro com ID para facilitar identificação
          throw new BadRequestException(`Linha ${index + 2} (ID: ${leadId}): ${error.message}`);
        }
      }

      // Converte Raça para itens_interesse
      if (lead.raca) {
        const racaArray = this.parseItemInteresseArray(lead.raca);
        lead.itens_interesse = racaArray || [];
      } else {
        lead.itens_interesse = [];
      }

      // Converte Situacao para status
      if (lead.situacao) {
        const statusArray = this.parseStatusArray(lead.situacao);
        lead.status = statusArray || [];
      } else {
        lead.status = [];
      }

      // Remove campos temporários
      delete lead.raca;
      delete lead.situacao;

      // Converte origem_lead
      if (lead.origem_lead) {
        lead.origem_lead = this.parseOrigemLead(lead.origem_lead);
      }

      // Vendedor será resolvido no serviço de importação (buscar por nome)

      return lead;
    }).filter((lead) => lead !== null); // Remove linhas desconsideradas
  }

  /**
   * Mapeia dados do CSV para DTOs de Lead
   */
  private mapCsvDataToLeads(data: any[]): ImportLeadDto[] {
    return this.mapExcelDataToLeads(data); // Mesma lógica
  }

  /**
   * Obtém valor de célula tentando múltiplos nomes de coluna
   */
  private getCellValue(row: any, possibleNames: string[]): string | undefined {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
        return String(row[name]).trim();
      }
    }
    return undefined;
  }

  /**
   * Parseia valor de array (pode vir como string separada por vírgula ou ponto e vírgula)
   */
  private parseArrayValue(row: any, possibleNames: string[]): string[] | undefined {
    const value = this.getCellValue(row, possibleNames);
    if (!value) return undefined;

    // Divide por vírgula, ponto e vírgula ou pipe
    return value.split(/[,;|]/).map((item) => item.trim()).filter((item) => item.length > 0);
  }

  /**
   * Parseia data de vários formatos
   * Suporta: dd/mm/yyyy, yyyy-mm-dd, Excel serial date, Date object
   */
  private parseDate(dateValue: any): string {
    if (!dateValue) return undefined;

    // Se já é uma data válida
    if (dateValue instanceof Date) {
      return dateValue.toISOString().split('T')[0];
    }

    // Se é número (Excel serial date)
    if (typeof dateValue === 'number') {
      const date = XLSX.SSF.parse_date_code(dateValue);
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }

    // Se é string, tenta parsear
    const dateStr = String(dateValue).trim();
    
    // Tenta formato brasileiro dd/mm/yyyy ou dd-mm-yyyy
    const brazilianDateRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
    const match = dateStr.match(brazilianDateRegex);
    
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      
      // Valida a data
      if (day < 1 || day > 31 || month < 1 || month > 12) {
        throw new BadRequestException(`Data inválida: ${dateValue}`);
      }
      
      const date = new Date(year, month - 1, day);
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        throw new BadRequestException(`Data inválida: ${dateValue}`);
      }
      
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // Tenta formato ISO yyyy-mm-dd
    const isoDateRegex = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/;
    const isoMatch = dateStr.match(isoDateRegex);
    
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10);
      const day = parseInt(isoMatch[3], 10);
      
      if (day < 1 || day > 31 || month < 1 || month > 12) {
        throw new BadRequestException(`Data inválida: ${dateValue}`);
      }
      
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // Tenta parsear como Date padrão do JavaScript
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      throw new BadRequestException(`Data inválida: ${dateValue}. Formatos aceitos: dd/mm/yyyy, yyyy-mm-dd`);
    }

    return date.toISOString().split('T')[0];
  }

  /**
   * Parseia array de status
   */
  private parseStatusArray(value: string | string[]): LeadStatus[] {
    if (Array.isArray(value)) {
      return value.map((v) => this.parseStatus(v)).filter((v) => v !== null) as LeadStatus[];
    }

    const values = String(value).split(/[,;|]/).map((v) => v.trim());
    return values.map((v) => this.parseStatus(v)).filter((v) => v !== null) as LeadStatus[];
  }

  /**
   * Parseia um status individual
   */
  private parseStatus(value: string): LeadStatus | null {
    const normalized = value.toUpperCase().trim();
    const statusMap: Record<string, LeadStatus> = {
      'NAO_ATENDEU': LeadStatus.NAO_ATENDEU,
      'NAO É MOMENTO': LeadStatus.NAO_E_MOMENTO,
      'NAO E MOMENTO': LeadStatus.NAO_E_MOMENTO,
      'TEM_INTERESSE': LeadStatus.TEM_INTERESSE,
      'TEM INTERESSE': LeadStatus.TEM_INTERESSE,
      'NAO_TEM_INTERESSE': LeadStatus.NAO_TEM_INTERESSE,
      'NAO TEM INTERESSE': LeadStatus.NAO_TEM_INTERESSE,
      'TELEFONE_INVALIDO': LeadStatus.TELEFONE_INVALIDO,
      'TELEFONE INVÁLIDO': LeadStatus.TELEFONE_INVALIDO,
      'LEAD_QUENTE': LeadStatus.LEAD_QUENTE,
      'LEAD QUENTE': LeadStatus.LEAD_QUENTE,
      'RETORNO_AGENDADO': LeadStatus.RETORNO_AGENDADO,
      'RETORNO AGENDADO': LeadStatus.RETORNO_AGENDADO,
      'NAO_E_PECUARISTA': LeadStatus.NAO_E_PECUARISTA,
      'NAO É PECUARISTA': LeadStatus.NAO_E_PECUARISTA,
      'AGUARDANDO_OFERTAS': LeadStatus.AGUARDANDO_OFERTAS,
      'AGUARDANDO OFERTAS': LeadStatus.AGUARDANDO_OFERTAS,
    };

    return statusMap[normalized] || null;
  }

  /**
   * Parseia array de itens de interesse
   */
  private parseItemInteresseArray(value: string | string[]): ItemInteresse[] {
    if (Array.isArray(value)) {
      return value.map((v) => this.parseItemInteresse(v)).filter((v) => v !== null) as ItemInteresse[];
    }

    const values = String(value).split(/[,;|]/).map((v) => v.trim());
    return values.map((v) => this.parseItemInteresse(v)).filter((v) => v !== null) as ItemInteresse[];
  }

  /**
   * Parseia um item de interesse individual
   */
  private parseItemInteresse(value: string): ItemInteresse | null {
    const normalized = value.toUpperCase().trim();
    const itemMap: Record<string, ItemInteresse> = {
      'GIR': ItemInteresse.GIR,
      'GUZERA': ItemInteresse.GUZERA,
      'INDUBRASIL': ItemInteresse.INDUBRASIL,
      'SINDI': ItemInteresse.SINDI,
      'NELORE': ItemInteresse.NELORE,
      'NELORE_MOCHO': ItemInteresse.NELORE_MOCHO,
      'NELORE MOCHO': ItemInteresse.NELORE_MOCHO,
      'TABAPUA': ItemInteresse.TABAPUA,
      'BRAHMAN': ItemInteresse.BRAHMAN,
      'ANGUS': ItemInteresse.ANGUS,
      'GIROLANDO': ItemInteresse.GIROLANDO,
      'NELORE_PINTADO': ItemInteresse.NELORE_PINTADO,
      'NELORE PINTADO': ItemInteresse.NELORE_PINTADO,
      'HOLANDES': ItemInteresse.HOLANDES,
      'BRANGUS': ItemInteresse.BRANGUS,
    };

    return itemMap[normalized] || null;
  }

  /**
   * Parseia origem do lead
   */
  private parseOrigemLead(value: string): OrigemLead | null {
    const normalized = value.toUpperCase().trim();
    const origemMap: Record<string, OrigemLead> = {
      'CAMPANHA_MKT': OrigemLead.CAMPANHA_MKT,
      'CAMPANHA MKT': OrigemLead.CAMPANHA_MKT,
      'HABILITADOS': OrigemLead.HABILITADOS,
      'BASE_RD': OrigemLead.BASE_RD,
      'BASE RD': OrigemLead.BASE_RD,
      'NETWORKING': OrigemLead.NETWORKING,
      'WHATSAPP': OrigemLead.WHATSAPP,
      'AGENTE_VENDAS': OrigemLead.AGENTE_VENDAS,
      'AGENTE VENDAS': OrigemLead.AGENTE_VENDAS,
      'BASE_CANAL_DO_CAMPO': OrigemLead.BASE_CANAL_DO_CAMPO,
      'BASE CANAL DO CAMPO': OrigemLead.BASE_CANAL_DO_CAMPO,
    };

    return origemMap[normalized] || null;
  }
}

