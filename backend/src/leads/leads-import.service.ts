import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import { OrigemLead } from './entities/lead.entity';
import { ImportLeadDto } from './dto/import-lead.dto';

@Injectable()
export class LeadsImportService {
  /**
   * Processa arquivo Excel (.xlsx, .xls)
   * Processa APENAS a primeira aba/guia da planilha
   * Retorna todos os leads da planilha (filtro por ID é feito no controller)
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

      // Lê a primeira linha para validar cabeçalhos
      // Tenta múltiplas abordagens para evitar erro "invalid column -1"
      let headers: string[] = [];
      
      try {
        // Abordagem 1: Tenta ler apenas a primeira linha usando range
        try {
          const headerRowArray = XLSX.utils.sheet_to_json(worksheet, { 
            header: 1,
            defval: '',
            range: '1:1', // Apenas primeira linha
          });

          if (headerRowArray && headerRowArray.length > 0 && headerRowArray[0]) {
            const firstRow = headerRowArray[0] as any[];
            headers = firstRow.map((h: any) => String(h || '').trim()).filter(h => h !== '');
          }
        } catch (rangeError) {
          // Se falhar com range, tenta sem range
          console.warn('Erro ao ler cabeçalhos com range, tentando sem range:', rangeError.message);
        }
        
        // Se não conseguiu ler com range ou headers está vazio, tenta sem range
        if (headers.length === 0) {
          try {
            const headerRowArray = XLSX.utils.sheet_to_json(worksheet, { 
              header: 1,
              defval: '',
              // Sem range - lê tudo mas pegamos apenas a primeira linha
            });

            if (headerRowArray && headerRowArray.length > 0 && headerRowArray[0]) {
              const firstRow = headerRowArray[0] as any[];
              headers = firstRow.map((h: any) => String(h || '').trim()).filter(h => h !== '');
            }
          } catch (noRangeError) {
            console.warn('Erro ao ler cabeçalhos sem range:', noRangeError.message);
          }
        }
        
        // Se ainda não conseguiu, tenta ler diretamente do worksheet sem usar sheet_to_json
        // Isso evita problemas com range que podem causar "invalid column -1"
        if (headers.length === 0) {
          try {
            // Lê diretamente da primeira linha do worksheet
            if (worksheet['!ref']) {
              const range = XLSX.utils.decode_range(worksheet['!ref']);
              headers = [];
              // Lê até 100 colunas ou até o final do range, o que for menor
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
          } catch (directReadError) {
            console.warn('Erro ao ler cabeçalhos diretamente do worksheet:', directReadError.message);
          }
        }
        
        // Última tentativa: lê como objeto normal e pega as chaves (sem range)
        if (headers.length === 0) {
          try {
            const sampleData = XLSX.utils.sheet_to_json(worksheet, { 
              defval: '',
              // Não usa range para evitar erro "invalid column -1"
            });
            
            if (sampleData && sampleData.length > 0) {
              // Pega as chaves do primeiro objeto
              headers = Object.keys(sampleData[0] || {}).map(h => String(h).trim()).filter(h => h !== '');
            }
          } catch (sampleError) {
            console.warn('Erro ao ler cabeçalhos como objeto:', sampleError.message);
          }
        }
      } catch (headerError) {
        throw new BadRequestException(`Erro ao ler cabeçalhos da planilha: ${headerError.message}`);
      }

      // Valida estrutura mínima da planilha
      if (!headers || headers.length === 0) {
        throw new BadRequestException({
          erro: 'Estrutura da planilha inválida',
          detalhes: 'A planilha não possui cabeçalho válido na primeira linha.',
          colunasObrigatorias: ['ID', 'Nome ou LEAD', 'Email', 'Telefone', 'Origem do Lead'],
        });
      }
      
      // Valida estrutura mínima da planilha
      try {
        this.validateHeaders(headers);
      } catch (validationError) {
        // Se a validação falhar, propaga o erro
        throw validationError;
      }

      // Lê como JSON (primeira linha como cabeçalho)
      // Usa raw: false para converter tudo para string e evitar problemas com tipos
      // defval: '' garante que células vazias retornem string vazia
      let data: any[];
      try {
        // Tenta primeiro sem especificar range para evitar erro "invalid column -1"
        data = XLSX.utils.sheet_to_json(worksheet, { 
          raw: false, // Converte tudo para string para evitar problemas com tipos
          defval: '', // Valor padrão para células vazias
          blankrows: false, // Ignora linhas completamente vazias
          // Não usa dateNF nem range para evitar problemas
        });
      } catch (error) {
        console.error('Erro ao ler dados da planilha (primeira tentativa):', error.message);
        // Se der erro, tenta com raw: true como fallback
        try {
          data = XLSX.utils.sheet_to_json(worksheet, { 
            raw: true,
            defval: null,
            blankrows: false,
          });
        } catch (fallbackError) {
          console.error('Erro ao ler dados da planilha (fallback):', fallbackError.message);
          throw new BadRequestException(`Erro ao ler dados da planilha: ${error.message}. Erro no fallback: ${fallbackError.message}`);
        }
      }

      // Valida se há dados na planilha
      if (!data || data.length === 0) {
        throw new BadRequestException('A primeira aba da planilha está vazia. Verifique se há dados na planilha.');
      }

      // Informa quantas abas foram ignoradas (se houver mais de uma)
      if (workbook.SheetNames.length > 1) {
        console.log(`⚠️ Arquivo contém ${workbook.SheetNames.length} abas. Processando apenas a primeira aba: "${sheetName}". As demais abas serão ignoradas.`);
      }

      // Processa todos os dados (filtro por ID será feito no controller)
      if (data.length === 0) {
        throw new BadRequestException('Não há dados para importar na planilha.');
      }

      return this.mapExcelDataToLeads(data);
    } catch (error) {
      // Log detalhado do erro para debug
      console.error('Erro ao processar arquivo Excel:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      
      // Se o erro já contém informações sobre ID e linha, propaga como está
      if (error.message && (error.message.includes('ID:') || error.message.includes('Linha'))) {
        throw error;
      }
      
      // Se já é um BadRequestException, propaga
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Se o erro contém "invalid column", fornece mensagem mais específica
      if (error.message && error.message.includes('invalid column')) {
        throw new BadRequestException({
          erro: 'Erro ao processar arquivo Excel',
          detalhes: 'Ocorreu um erro ao ler a estrutura da planilha. Verifique se todas as colunas estão preenchidas corretamente e se não há células com erros (#REF!, #N/A, etc.).',
          erroOriginal: error.message,
          sugestao: 'Tente salvar a planilha novamente no Excel e verifique se não há fórmulas quebradas ou referências inválidas.',
        });
      }
      
      throw new BadRequestException(`Erro ao processar arquivo Excel: ${error.message}`);
    }
  }

  /**
   * Processa arquivo CSV
   * Retorna todos os leads da planilha (filtro por ID é feito no controller)
   */
  async processCsvFile(filePath: string): Promise<ImportLeadDto[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      let headers: string[] = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headerList) => {
          // Captura os cabeçalhos do CSV
          headers = headerList;
          // Valida estrutura mínima
          this.validateHeaders(headers);
        })
        .on('data', (data) => results.push(data))
        .on('end', () => {
          try {
            // Processa todos os dados (filtro por ID será feito no controller)
            if (results.length === 0) {
              reject(new BadRequestException('Não há dados para importar no arquivo CSV.'));
              return;
            }
            
            const leads = this.mapCsvDataToLeads(results);
            resolve(leads);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(new BadRequestException(`Erro ao ler arquivo CSV: ${error.message}`));
        });
    });
  }

  /**
   * Valida se a planilha possui todas as colunas obrigatórias
   */
  private validateHeaders(headers: string[]): void {
    const headersLower = headers.map(h => String(h).toLowerCase().trim());

    // Define colunas obrigatórias e suas variações aceitas
    const colunasObrigatorias = {
      id: ['id', 'id (coluna a)', '__empty'], // __EMPTY é usado quando primeira coluna não tem nome
      nome: ['lead', 'nome', 'nome/razão social', 'nome/razao social', 'nome_razao_social'],
      email: ['email', 'e-mail', 'e-mail'],
      telefone: ['telefone', 'tel', 'telefone (lead)'],
      origem: ['origem do lead', 'origem do lead', 'origem', 'origem_lead', 'origem_do_lead', 'origen do lead', 'origem_do_lead'],
    };

    // Verifica se todas as colunas obrigatórias existem
    const colunasFaltantes: string[] = [];
    
    // Verifica ID (primeira coluna ou coluna com nome ID)
    const temId = headersLower.some(h => colunasObrigatorias.id.includes(h)) || 
                  headers.length > 0; // Se tem pelo menos uma coluna, assume que primeira é ID
    
    if (!temId) {
      colunasFaltantes.push('ID');
    }

    // Verifica Nome/LEAD
    const temNome = headersLower.some(h => colunasObrigatorias.nome.includes(h));
    if (!temNome) {
      colunasFaltantes.push('Nome ou LEAD');
    }

    // Verifica Email
    const temEmail = headersLower.some(h => colunasObrigatorias.email.includes(h));
    if (!temEmail) {
      colunasFaltantes.push('Email');
    }

    // Verifica Telefone
    const temTelefone = headersLower.some(h => colunasObrigatorias.telefone.includes(h));
    if (!temTelefone) {
      colunasFaltantes.push('Telefone');
    }

    // Verifica Origem do Lead
    const temOrigem = headersLower.some(h => colunasObrigatorias.origem.includes(h));
    if (!temOrigem) {
      colunasFaltantes.push('Origem do Lead');
    }

    // Se faltar alguma coluna, lança erro
    if (colunasFaltantes.length > 0) {
      throw new BadRequestException({
        erro: 'Estrutura da planilha incompleta',
        detalhes: `A planilha não possui todas as colunas obrigatórias.`,
        colunasFaltantes: colunasFaltantes,
        colunasObrigatorias: ['ID', 'Nome ou LEAD', 'Email', 'Telefone', 'Origem do Lead'],
        colunasEncontradas: headers,
      });
    }
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
   * - Descrição do produto: anotacoes
   * - Vendedor: vendedor_id (buscar por nome)
   * - Origem do Lead: origem_lead
   * - Total Conversões: total_conversoes
   */
  private mapExcelDataToLeads(data: any[]): ImportLeadDto[] {
    // Filtra linhas completamente vazias ou inválidas antes de processar
    const validRows = data.filter(row => {
      if (!row || typeof row !== 'object') return false;
      const keys = Object.keys(row);
      // Se não tem chaves ou todas as chaves têm valores vazios, ignora
      if (keys.length === 0) return false;
      return keys.some(key => row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '');
    });

    return validRows.map((row, index) => {
      // Obtém o ID da primeira coluna
      // A primeira coluna pode vir como 'ID', 'id', 'Id', ou como primeira chave do objeto
      const rowKeys = Object.keys(row);
      const firstColumnKey = rowKeys[0];
      
      // Tenta diferentes nomes possíveis para a primeira coluna
      // Prioridade: primeiro tenta nomes específicos, depois a primeira chave do objeto
      let idValue = 
        row['ID'] || 
        row['id'] || 
        row['Id'] || 
        row['__EMPTY'] || // XLSX pode usar __EMPTY para colunas sem nome
        '';
      
      // Se não encontrou pelos nomes específicos, usa a primeira coluna do objeto
      if (!idValue && firstColumnKey) {
        idValue = row[firstColumnKey];
      }

      // ID agora é INT, então precisa ser um número válido
      const idValueStr = String(idValue || '').trim();
      let leadId: number | null = null;
      
      if (idValueStr && !isNaN(Number(idValueStr))) {
        leadId = parseInt(idValueStr, 10);
      }

      const lead: any = {
        // Primeira coluna = ID (Coluna A) - agora é number
        id: leadId,
        
        // Data = data_entrada
        data_entrada: this.getCellValue(row, ['Data', 'data', 'data_entrada', 'Data Entrada']),
        
        // LEAD = nome_razao_social (obrigatório)
        // Aceita: LEAD, NOME, Nome, Nome/Razão Social, etc.
        nome_razao_social: this.getCellValue(row, ['LEAD', 'lead', 'Lead', 'NOME', 'Nome', 'nome', 'Nome/Razão Social', 'nome_razao_social', 'Razão Social', 'razao_social']),
        
        // Telefone = telefone
        telefone: this.getCellValue(row, ['Telefone', 'telefone', 'Tel', 'tel']),
        
        // Email = email
        email: this.getCellValue(row, ['Email', 'email', 'E-mail', 'e-mail', 'E-Mail']),
        
        // UF = uf
        uf: this.getCellValue(row, ['UF', 'uf', 'Estado', 'estado']),
        
        // Município = municipio
        municipio: this.getCellValue(row, ['Município', 'municipio', 'Municipio', 'Cidade', 'cidade', 'Município (lead)', 'Municipio (lead)']),
        
        // APELIDO = nome_fantasia_apelido
        nome_fantasia_apelido: this.getCellValue(row, ['APELIDO', 'Apelido', 'apelido', 'Nome Fantasia', 'nome_fantasia']),
        
        // Descrição do produto = anotacoes
        anotacoes: this.getCellValue(row, ['Descrição do produto', 'Descrição do Produto', 'descrição do produto', 'Descricao do produto', 'Descrição', 'Anotações', 'anotacoes']),
        
        // OCORRENCIA = ocorrencia (processamento complexo será feito no service)
        ocorrencia: this.getCellValue(row, ['OCORRENCIA', 'Ocorrencia', 'ocorrencia', 'Ocorrência', 'ocorrência']),
        
        // TAGS = tags (processamento será feito no service)
        tags: this.getCellValue(row, ['TAGS', 'Tags', 'tags', 'Tag', 'tag']),
        
        // Vendedor = vendedor_id (buscar por nome)
        vendedor: this.getCellValue(row, ['Vendedor', 'vendedor', 'Vendedor (lead)', 'Vendedor ID', 'vendedor_id']),
        
        // Origem do Lead = origem_lead
        origem_lead: this.getCellValue(row, ['Origem do Lead', 'Origem do lead', 'origem do lead', 'Origem', 'origem', 'origem_lead', 'ORIGEM_DO_LEAD', 'ORIGEM DO LEAD']),
        
        // Total Conversões = total_conversoes
        // Aceita várias variações: "Total Conversões", "Total de conversões", "Total Conversoes", etc.
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

      // Valida campos obrigatórios: apenas ID e LEAD
      // ID agora é number, então verifica se é um número válido
      if (lead.id === null || lead.id === undefined || isNaN(lead.id)) {
        // Se ID não estiver preenchido ou não for número válido, retorna null para desconsiderar
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
          // Calcula o número da linha real na planilha: index + 2 (linha 1 é cabeçalho)
          const linhaReal = index + 2;
          throw new BadRequestException(`Linha ${linhaReal} (ID: ${lead.id}): ${error.message}`);
        }
      }
      
      // OCORRENCIA e TAGS serão processados no leads.service.ts após criar o lead

      // Origem do Lead é OBRIGATÓRIO na importação
      if (!lead.origem_lead || String(lead.origem_lead).trim() === '') {
        // Se origem_lead estiver vazio, ignora o lead
        return null;
      }

      // Converte origem_lead
      const origemParsed = this.parseOrigemLead(lead.origem_lead);
      if (!origemParsed) {
        // Se origem_lead não for válida, ignora o lead
        return null;
      }
      lead.origem_lead = origemParsed;

      // Converte total_conversoes para número
      // Pode vir como string, número ou notação científica
      if (lead.total_conversoes !== undefined && lead.total_conversoes !== null) {
        const totalConversoesValue = String(lead.total_conversoes).trim();
        
        // Ignora erros do Excel
        if (totalConversoesValue.startsWith('#')) {
          lead.total_conversoes = undefined;
        } else if (totalConversoesValue !== '') {
          // Tenta converter para número (suporta notação científica)
          const numValue = Number(totalConversoesValue);
          if (!isNaN(numValue) && isFinite(numValue)) {
            // Converte para inteiro
            const intValue = Math.floor(numValue);
            lead.total_conversoes = intValue;
          } else {
            // Se não conseguir converter, tenta parsear como inteiro diretamente
            const parsedInt = parseInt(totalConversoesValue, 10);
            if (!isNaN(parsedInt)) {
              lead.total_conversoes = parsedInt;
            } else {
              lead.total_conversoes = undefined;
            }
          }
        } else {
          lead.total_conversoes = undefined;
        }
      } else {
        // Se estiver vazio ou undefined, define como undefined explicitamente
        lead.total_conversoes = undefined;
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
   * Trata células com erros do Excel (#REF!, #N/A, etc.)
   * Faz busca case-insensitive e normaliza espaços
   */
  private getCellValue(row: any, possibleNames: string[]): string | undefined {
    // Primeiro tenta busca exata (mais rápida)
    for (const name of possibleNames) {
      const value = row[name];
      
      // Ignora valores undefined, null ou vazios
      if (value === undefined || value === null || value === '') {
        continue;
      }
      
      // Converte para string e verifica se é um erro do Excel
      const strValue = String(value).trim();
      
      // Ignora erros do Excel (começam com #)
      if (strValue.startsWith('#')) {
        continue;
      }
      
      // Ignora strings vazias após trim
      if (strValue === '') {
        continue;
      }
      
      return strValue;
    }
    
    // Se não encontrou com busca exata, tenta busca case-insensitive
    // Normaliza os nomes das colunas do row para comparação
    const rowKeys = Object.keys(row);
    const rowKeysLower = rowKeys.map(k => k.toLowerCase().trim());
    
    for (const name of possibleNames) {
      const nameLower = name.toLowerCase().trim();
      const index = rowKeysLower.indexOf(nameLower);
      
      if (index !== -1) {
        const actualKey = rowKeys[index];
        const value = row[actualKey];
        
        // Ignora valores undefined, null ou vazios
        if (value === undefined || value === null || value === '') {
          continue;
        }
        
        // Converte para string e verifica se é um erro do Excel
        const strValue = String(value).trim();
        
        // Ignora erros do Excel (começam com #)
        if (strValue.startsWith('#')) {
          continue;
        }
        
        // Ignora strings vazias após trim
        if (strValue === '') {
          continue;
        }
        
        return strValue;
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
   * Suporta: dd/mm/yyyy, dd/mm/yyyy HH:MM, yyyy-mm-dd, Excel serial date, Date object
   */
  private parseDate(dateValue: any): string {
    if (!dateValue) return undefined;

    // Ignora erros do Excel
    if (typeof dateValue === 'string' && dateValue.trim().startsWith('#')) {
      return undefined;
    }

    // Se já é uma data válida
    if (dateValue instanceof Date) {
      if (isNaN(dateValue.getTime())) {
        return undefined;
      }
      return dateValue.toISOString().split('T')[0];
    }

    // Se é número (Excel serial date)
    // IMPORTANTE: Com raw: false, números geralmente vêm como string
    // Mas se ainda vier como número, convertemos para string e processamos
    // Isso evita qualquer problema com XLSX.SSF.parse_date_code() que pode causar "invalid column -1"
    if (typeof dateValue === 'number') {
      // Valida se é um número válido (não NaN, não Infinity)
      if (isNaN(dateValue) || !isFinite(dateValue)) {
        return undefined;
      }
      
      // Converte para string e processa como string
      // Isso evita qualquer problema com XLSX.SSF.parse_date_code()
      return this.parseDateString(String(dateValue));
    }

    // Se é string, tenta parsear
    return this.parseDateString(String(dateValue));
  }

  /**
   * Parseia string de data em vários formatos
   */
  private parseDateString(dateStr: string): string | undefined {
    if (!dateStr || typeof dateStr !== 'string') {
      return undefined;
    }

    const trimmed = dateStr.trim();
    
    // Ignora erros do Excel
    if (trimmed.startsWith('#')) {
      return undefined;
    }

    // Remove hora se presente (formato: dd/mm/yyyy HH:MM ou dd/mm/yyyy HH:MM:SS)
    // Aceita: "15/11/2025 14:28", "15/11/2025 14:28:30", etc.
    const dateTimeRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?$/;
    const dateTimeMatch = trimmed.match(dateTimeRegex);
    
    if (dateTimeMatch) {
      const day = parseInt(dateTimeMatch[1], 10);
      const month = parseInt(dateTimeMatch[2], 10);
      const year = parseInt(dateTimeMatch[3], 10);
      
      // Valida a data
      if (day < 1 || day > 31 || month < 1 || month > 12) {
        return undefined;
      }
      
      const date = new Date(year, month - 1, day);
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return undefined;
      }
      
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // Tenta formato brasileiro dd/mm/yyyy ou dd-mm-yyyy (sem hora)
    const brazilianDateRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
    const match = trimmed.match(brazilianDateRegex);
    
    if (match) {
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);
      
      // Valida a data
      if (day < 1 || day > 31 || month < 1 || month > 12) {
        return undefined;
      }
      
      const date = new Date(year, month - 1, day);
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return undefined;
      }
      
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // Tenta formato ISO yyyy-mm-dd
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

    // Tenta parsear como Date padrão do JavaScript
    const date = new Date(trimmed);
    
    if (isNaN(date.getTime())) {
      return undefined;
    }

    return date.toISOString().split('T')[0];
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


