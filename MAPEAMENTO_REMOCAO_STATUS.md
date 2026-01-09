# 📋 Mapeamento de Remoção da Coluna STATUS da Tabela LEADS

## ⚠️ Objetivo
A coluna `status` (TEXT[]) será removida da tabela `leads` pois já está sendo controlada pela coluna `kanban_status_id`.

---

## 🔍 Ocorrências Encontradas

### 1. BACKEND - Entidade (Entity)

#### 1.1. `backend/src/leads/entities/lead.entity.ts`
- **Linha 81-88**: Definição da coluna `status` na entidade Lead
  ```typescript
  @Column({
    type: 'text',
    array: true,
    nullable: true,
  })
  status: LeadStatus[];
  ```
- **Linha 14-24**: Enum `LeadStatus` (verificar se ainda será necessário ou se pode ser removido)
  ```typescript
  export enum LeadStatus {
    NAO_ATENDEU = 'NAO_ATENDEU',
    NAO_E_MOMENTO = 'NAO_E_MOMENTO',
    // ... outros valores
  }
  ```

**Ação**: Remover a propriedade `status` da entidade. Avaliar se o enum `LeadStatus` ainda é necessário.

---

### 2. BACKEND - Service

#### 2.1. `backend/src/leads/leads.service.ts`
- **Linha 193-202**: Filtro por status no método `findAll()`
  ```typescript
  // Filtro por status (multiselect - pode ter vários)
  if (filterDto.status && filterDto.status.length > 0) {
    const statusArray = filterDto.status.map((status) => `'${status.replace(/'/g, "''")}'`).join(',');
    queryBuilder.andWhere(
      `lead.status && ARRAY[${statusArray}]::text[]`,
    );
  }
  ```
- **Linha 851-853**: Atribuição de status na importação de leads
  ```typescript
  if (leadData.status && leadData.status.length > 0) {
    leadToSave.status = leadData.status;
  }
  ```

**Ação**: 
- Remover o filtro por status do método `findAll()`
- Remover a atribuição de status na importação

---

### 3. BACKEND - DTOs (Data Transfer Objects)

#### 3.1. `backend/src/leads/dto/filter-leads.dto.ts`
- **Linha 10-24**: Campo `status` no DTO de filtro
  ```typescript
  @IsOptional()
  @Transform(({ value }) => {
    // Se for string, converte para array
    if (typeof value === 'string') {
      return [value];
    }
    // Se já for array, retorna como está
    if (Array.isArray(value)) {
      return value;
    }
    return value;
  })
  @IsArray()
  @IsEnum(LeadStatus, { each: true })
  status?: LeadStatus[];
  ```

**Ação**: Remover o campo `status` do DTO de filtro

---

#### 3.2. `backend/src/leads/dto/create-lead.dto.ts`
- **Linha 48-51**: Campo `status` no DTO de criação
  ```typescript
  @IsOptional()
  @IsArray()
  @IsEnum(LeadStatus, { each: true })
  status?: LeadStatus[];
  ```

**Ação**: Remover o campo `status` do DTO de criação

---

#### 3.3. `backend/src/leads/dto/update-lead.dto.ts`
- **Herda de CreateLeadDto**: Como `UpdateLeadDto` estende `CreateLeadDto`, o campo `status` será removido automaticamente quando removermos de `CreateLeadDto`

**Ação**: Verificar se não há referências diretas ao campo `status` neste arquivo

---

#### 3.4. `backend/src/leads/dto/import-lead.dto.ts`
- **Linha 43-46**: Campo `status` no DTO de importação
  ```typescript
  @IsOptional()
  @IsArray()
  @IsEnum(LeadStatus, { each: true })
  status?: LeadStatus[]; // Situacao (mantido para compatibilidade, mas não será processado na importação)
  ```

**Ação**: Remover o campo `status` do DTO de importação

---

### 4. BACKEND - Import Service

#### 4.1. `backend/src/leads/leads-import.service.ts`
- **Linha 141**: Comentário sobre mapeamento de "Situacao" para status
  ```typescript
  * - Situacao: status (adicionar ao array)
  ```
- **Linha 363-372**: Método `parseStatusArray()` para parsear array de status
  ```typescript
  private parseStatusArray(value: string | string[]): LeadStatus[] {
    // ... implementação
  }
  ```
- **Linha 374-400**: Método `parseStatus()` para parsear status individual
  ```typescript
  private parseStatus(value: string): LeadStatus | null {
    // ... implementação com mapeamento de valores
  }
  ```

**Ação**: 
- Remover comentário sobre mapeamento de Situacao
- Remover métodos `parseStatusArray()` e `parseStatus()` se não forem mais utilizados
- Verificar se há referências a "Situacao" no mapeamento de colunas da planilha

---

### 5. BACKEND - Migrações SQL

#### 5.1. `backend/src/migrations/001-create-tables.sql`
- **Linha 31**: Definição da coluna `status` na criação da tabela
  ```sql
  status TEXT[], -- Array de strings para multiselect
  ```
- **Linha 51**: Índice GIN na coluna `status`
  ```sql
  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads USING GIN(status);
  ```

**Ação**: 
- Criar nova migração para remover a coluna `status` e o índice `idx_leads_status`
- **NOTA**: Não modificar migrações antigas, criar nova migração

---

#### 5.2. `backend/src/migrations/004-fix-leads-id-to-int.sql`
- **Linha 42**: Definição da coluna `status` na recriação da tabela
  ```sql
  status TEXT[],
  ```
- **Linha 63**: Índice GIN na coluna `status`
  ```sql
  CREATE INDEX IF NOT EXISTS idx_leads_status ON leads USING GIN(status);
  ```

**Ação**: 
- Criar nova migração para remover a coluna `status` e o índice `idx_leads_status`
- **NOTA**: Não modificar migrações antigas, criar nova migração

---

#### 5.3. Outros arquivos SQL que podem referenciar status
- `INSTRUCOES_RAPIDAS_FIX.md` (linha 33, 48)
- `SOLUCAO_ERRO_SEQUENCE.md` (linha 55, 76)

**Ação**: Atualizar documentação se necessário, mas priorizar a criação de nova migração

---

### 6. BACKEND - Scripts de Seed

#### 6.1. `backend/src/scripts/seed.ts`
- **Linha 65**: Atribuição de status em lead de exemplo
  ```typescript
  status: [LeadStatus.TEM_INTERESSE, LeadStatus.LEAD_QUENTE],
  ```
- **Linha 77**: Atribuição de status em lead de exemplo
  ```typescript
  status: [LeadStatus.RETORNO_AGENDADO],
  ```
- **Linha 89**: Atribuição de status em lead de exemplo
  ```typescript
  status: [LeadStatus.NAO_ATENDEU],
  ```

**Ação**: Remover todas as atribuições de `status` nos objetos de exemplo

---

### 7. FRONTEND - Types

#### 7.1. `frontend/src/types/lead.ts`
- **Linha 1-11**: Enum `LeadStatus` exportado
  ```typescript
  export enum LeadStatus {
    NAO_ATENDEU = 'NAO_ATENDEU',
    // ... outros valores
  }
  ```
- **Linha 49**: Campo `status` na interface `Lead`
  ```typescript
  status?: LeadStatus[]
  ```
- **Linha 84**: Campo `status` na interface `CreateLeadDto`
  ```typescript
  status?: LeadStatus[]
  ```
- **Linha 93**: Campo `status` na interface `FilterLeadsDto`
  ```typescript
  status?: LeadStatus
  ```

**Ação**: 
- Remover campo `status` das interfaces `Lead`, `CreateLeadDto` e `FilterLeadsDto`
- Avaliar se o enum `LeadStatus` ainda é necessário (pode ser usado em outros lugares)

---

### 8. FRONTEND - Telas/Componentes

#### 8.1. `frontend/src/pages/LeadsList.tsx`
- **Linha 33**: Verificação de filtro ativo por status
  ```typescript
  filters.status ||
  ```
- **Linha 70-72**: Adição de parâmetro status na query
  ```typescript
  if (filters.status) {
    params.append('status', filters.status)
  }
  ```
- **Linha 197-210**: Função `formatStatus()` para formatar exibição de status
  ```typescript
  const formatStatus = (status: LeadStatus) => {
    const labels: Record<LeadStatus, string> = {
      // ... mapeamento de labels
    }
    return labels[status] || status
  }
  ```
- **Linha 280-294**: Filtro de status (Desktop)
  ```typescript
  <div className="filter-group">
    <label>Status</label>
    <select
      value={filters.status || ''}
      onChange={(e) =>
        setFilters({ ...filters, status: e.target.value ? (e.target.value as LeadStatus) : undefined })
      }
    >
      <option value="">Todos</option>
      {Object.values(LeadStatus).map((status) => (
        <option key={status} value={status}>
          {formatStatus(status)}
        </option>
      ))}
    </select>
  </div>
  ```
- **Linha 413-427**: Filtro de status (Mobile - Modal)
  ```typescript
  <div className="filter-group">
    <label>Status</label>
    <select
      value={filters.status || ''}
      onChange={(e) =>
        setFilters({ ...filters, status: e.target.value ? (e.target.value as LeadStatus) : undefined })
      }
    >
      // ... opções
    </select>
  </div>
  ```
- **Linha 648-654**: Exibição de status no card mobile (seção expandível)
  ```typescript
  <div className="lead-card-field">
    <span className="lead-card-label">Status</span>
    <span className="lead-card-value">
      {lead.status?.length
        ? lead.status.map((s) => formatStatus(s)).join(', ')
        : '-'}
    </span>
  </div>
  ```
- **Linha 789-795**: Exibição de status no card desktop
  ```typescript
  <div className="lead-card-field">
    <span className="lead-card-label">Status</span>
    <span className="lead-card-value">
      {lead.status?.length
        ? lead.status.map((s) => formatStatus(s)).join(', ')
        : '-'}
    </span>
  </div>
  ```
- **Linha 842**: Cabeçalho da coluna "Status" na tabela
  ```typescript
  <th>Status</th>
  ```
- **Linha 883-886**: Exibição de status na tabela
  ```typescript
  <td>
    {lead.status?.length
      ? lead.status.map((s) => formatStatus(s)).join(', ')
      : '-'}
  </td>
  ```

**Ação**: 
- Remover filtro de status (Desktop e Mobile)
- Remover exibição de status em cards (mobile e desktop)
- Remover coluna "Status" da tabela
- Remover função `formatStatus()` se não for mais utilizada
- Remover verificação de filtro ativo por status

---

#### 8.2. `frontend/src/components/EditLeadModal.tsx`
- **Linha 34**: Inicialização do campo status no formData
  ```typescript
  status: lead.status || [],
  ```
- **Linha 159-168**: Função `handleStatusChange()` para gerenciar mudanças de status
  ```typescript
  const handleStatusChange = (status: LeadStatus, checked: boolean) => {
    setFormData((prev) => {
      const current = prev.status || []
      if (checked) {
        return { ...prev, status: [...current, status] }
      } else {
        return { ...prev, status: current.filter((s) => s !== status) }
      }
    })
  }
  ```
- **Linha 355-368**: Campo de seleção de status (multiselect com checkboxes)
  ```typescript
  <div>
    <label>Status (multiselect)</label>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
      {Object.values(LeadStatus).map((status) => (
        <label key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={formData.status?.includes(status) || false}
            onChange={(e) => handleStatusChange(status, e.target.checked)}
          />
          <span>{formatLabel(status)}</span>
        </label>
      ))}
    </div>
  </div>
  ```

**Ação**: 
- Remover inicialização de status no formData
- Remover função `handleStatusChange()`
- Remover campo de seleção de status do formulário

---

#### 8.3. `frontend/src/pages/LeadForm.tsx`
- **Linha 58**: Inicialização do campo status no formData
  ```typescript
  status: lead.status || [],
  ```
- **Linha 85-94**: Função `handleStatusChange()` para gerenciar mudanças de status
  ```typescript
  const handleStatusChange = (status: LeadStatus, checked: boolean) => {
    setFormData((prev) => {
      const current = prev.status || []
      if (checked) {
        return { ...prev, status: [...current, status] }
      } else {
        return { ...prev, status: current.filter((s) => s !== status) }
      }
    })
  }
  ```
- **Linha 237-250**: Campo de seleção de status (multiselect com checkboxes)
  ```typescript
  <div className="form-group">
    <label>Status (multiselect)</label>
    <div className="checkbox-group">
      {Object.values(LeadStatus).map((status) => (
        <label key={status} className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.status?.includes(status) || false}
            onChange={(e) => handleStatusChange(status, e.target.checked)}
          />
          {formatLabel(status)}
        </label>
      ))}
    </div>
  </div>
  ```

**Ação**: 
- Remover inicialização de status no formData
- Remover função `handleStatusChange()`
- Remover campo de seleção de status do formulário

---

### 9. FRONTEND - Filtros

#### 9.1. `frontend/src/pages/LeadsList.tsx`
- Já mapeado na seção 8.1 (Telas/Componentes)

---

### 10. DOCUMENTAÇÃO

#### 10.1. `IMPORTACAO_LEADS.md`
- **Linha 64-73**: Seção sobre valores aceitos para Status
  ```markdown
  #### Status (campo "Situacao"):
  - NAO_ATENDEU
  - NAO_E_MOMENTO
  - TEM_INTERESSE
  - ...
  ```
- **Linha 101**: Exemplo de planilha com coluna "Situacao"
- **Linha 188**: Menção a arrays de Status na importação

**Ação**: 
- Remover seção sobre Status
- Atualizar exemplos de planilha removendo coluna "Situacao"
- Atualizar menções a arrays de Status

---

#### 10.2. `ANALISE_IMPORTACAO_LEADS.md`
- **Linha 31**: Mapeamento de Situacao → `leads.status[]` marcado como "SERÁ REMOVIDO"
- **Linha 377**: Checklist item sobre remover campo `status`

**Ação**: 
- Confirmar remoção do mapeamento
- Marcar item do checklist como concluído

---

#### 10.3. `API_EXAMPLES.md`
- **Linha 118**: Exemplo de resposta da API com campo `status`
  ```json
  "status": ["TEM_INTERESSE", "LEAD_QUENTE"],
  ```
- **Linha 156**: Exemplo de criação de lead com campo `status`
  ```json
  "status": ["TEM_INTERESSE"],
  ```
- **Linha 175**: Exemplo de atualização de lead com campo `status`
  ```json
  "status": ["TEM_INTERESSE", "LEAD_QUENTE"],
  ```

**Ação**: 
- Remover campo `status` de todos os exemplos de API
- Atualizar exemplos de criação e atualização de leads

---

## 📊 Resumo por Categoria

| Categoria | Arquivos | Ocorrências |
|-----------|----------|-------------|
| **Backend - Entity** | 1 | 2 (coluna + enum) |
| **Backend - Service** | 1 | 2 (filtro + importação) |
| **Backend - DTOs** | 4 | 4 campos |
| **Backend - Import Service** | 1 | 3 (comentário + 2 métodos) |
| **Backend - Migrações SQL** | 2 | 4 (2 colunas + 2 índices) |
| **Backend - Scripts** | 1 | 3 atribuições |
| **Frontend - Types** | 1 | 4 (enum + 3 interfaces) |
| **Frontend - Telas** | 2 | ~15 ocorrências |
| **Frontend - Componentes** | 1 | 3 ocorrências |
| **Documentação** | 3 | ~8 ocorrências |
| **TOTAL** | **17 arquivos** | **~48 ocorrências** |

---

## ⚠️ Observações Importantes

1. **Migrações SQL**: Não modificar migrações antigas. Criar uma nova migração para remover a coluna e o índice.

2. **Enum LeadStatus**: Avaliar se ainda é necessário após a remoção. Pode ser usado em outros contextos não relacionados à coluna `status` da tabela `leads`.

3. **Importação de Planilhas**: A coluna "Situacao" nas planilhas de importação não será mais processada. Atualizar documentação e considerar avisar usuários.

4. **Filtros**: O filtro por status será removido. Verificar se há necessidade de substituir por filtro por `kanban_status_id`.

5. **Dados Existentes**: Considerar migração de dados se houver necessidade de preservar valores antigos da coluna `status` antes de removê-la.

6. **Testes**: Verificar se há testes unitários ou de integração que referenciam a coluna `status` e atualizá-los.

---

## ✅ Checklist de Remoção

- [ ] Backend: Remover coluna da entidade Lead
- [ ] Backend: Remover filtro por status no service
- [ ] Backend: Remover atribuição de status na importação
- [ ] Backend: Remover campo status dos DTOs (Filter, Create, Update, Import)
- [ ] Backend: Remover métodos de parse de status no import service
- [ ] Backend: Criar migração SQL para remover coluna e índice
- [ ] Backend: Remover atribuições de status no script de seed
- [ ] Frontend: Remover campo status dos types/interfaces
- [ ] Frontend: Remover filtro de status em LeadsList
- [ ] Frontend: Remover exibição de status em cards e tabela
- [ ] Frontend: Remover campo de status em EditLeadModal
- [ ] Frontend: Remover campo de status em LeadForm
- [ ] Documentação: Atualizar IMPORTACAO_LEADS.md
- [ ] Documentação: Atualizar ANALISE_IMPORTACAO_LEADS.md
- [ ] Documentação: Atualizar API_EXAMPLES.md (remover status dos exemplos)
- [ ] Testes: Verificar e atualizar testes se necessário

---

**Data do Mapeamento**: 2025-01-27
**Status**: ✅ Mapeamento Completo - Aguardando Aprovação para Implementação

