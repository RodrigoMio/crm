# 📋 Mapeamento de Remoção da Coluna ITENS_INTERESSE da Tabela LEADS

## ⚠️ Objetivo
A coluna `itens_interesse` (TEXT[]) será removida da tabela `leads`.

---

## 🔍 Ocorrências Encontradas

### 1. BACKEND - Entidade (Entity)

#### 1.1. `backend/src/leads/entities/lead.entity.ts`
- **Linha 26-40**: Enum `ItemInteresse` (verificar se ainda será necessário ou se pode ser removido)
  ```typescript
  export enum ItemInteresse {
    GIR = 'GIR',
    GUZERA = 'GUZERA',
    INDUBRASIL = 'INDUBRASIL',
    // ... outros valores
  }
  ```
- **Linha 81-88**: Definição da coluna `itens_interesse` na entidade Lead
  ```typescript
  // Itens de interesse é um array (multiselect)
  // Usa array nativo do PostgreSQL para melhor performance e compatibilidade
  @Column({
    type: 'text',
    array: true,
    nullable: true,
  })
  itens_interesse: ItemInteresse[];
  ```

**Ação**: Remover a propriedade `itens_interesse` da entidade. Avaliar se o enum `ItemInteresse` ainda é necessário.

---

### 2. BACKEND - Service

#### 2.1. `backend/src/leads/leads.service.ts`
- **Linha 840-842**: Atribuição de itens_interesse na importação de leads
  ```typescript
  if (leadData.itens_interesse && leadData.itens_interesse.length > 0) {
    leadToSave.itens_interesse = leadData.itens_interesse;
  }
  ```

**Ação**: Remover a atribuição de itens_interesse na importação

---

### 3. BACKEND - DTOs (Data Transfer Objects)

#### 3.1. `backend/src/leads/dto/create-lead.dto.ts`
- **Linha 50-51**: Campo `itens_interesse` no DTO de criação
  ```typescript
  @IsOptional()
  @IsArray()
  @IsEnum(ItemInteresse, { each: true })
  itens_interesse?: ItemInteresse[];
  ```

**Ação**: Remover o campo `itens_interesse` do DTO de criação

---

#### 3.2. `backend/src/leads/dto/update-lead.dto.ts`
- **Herda de CreateLeadDto**: Como `UpdateLeadDto` estende `CreateLeadDto`, o campo `itens_interesse` será removido automaticamente quando removermos de `CreateLeadDto`

**Ação**: Verificar se não há referências diretas ao campo `itens_interesse` neste arquivo

---

#### 3.3. `backend/src/leads/dto/import-lead.dto.ts`
- **Linha 45-46**: Campo `itens_interesse` no DTO de importação
  ```typescript
  @IsOptional()
  @IsArray()
  @IsEnum(ItemInteresse, { each: true })
  itens_interesse?: ItemInteresse[]; // Raça
  ```

**Ação**: Remover o campo `itens_interesse` do DTO de importação

---

### 4. BACKEND - Import Service

#### 4.1. `backend/src/leads/leads-import.service.ts`
- **Linha 139**: Comentário sobre mapeamento de "Raça" para itens_interesse
  ```typescript
  * - Raça: itens_interesse (adicionar ao array)
  ```
- **Linha 194-195**: Mapeamento da coluna "Raça" da planilha
  ```typescript
  // Raça = itens_interesse (adicionar ao array)
  raca: this.getCellValue(row, ['Raça', 'raca', 'Raca', 'raça', 'Raça (lead)']),
  ```
- **Linha 237-243**: Conversão de Raça para itens_interesse
  ```typescript
  // Converte Raça para itens_interesse
  if (lead.raca) {
    const racaArray = this.parseItemInteresseArray(lead.raca);
    lead.itens_interesse = racaArray || [];
  } else {
    lead.itens_interesse = [];
  }
  ```
- **Linha 246**: Remoção do campo temporário `raca`
  ```typescript
  delete lead.raca;
  ```
- **Linha 364-372**: Método `parseItemInteresseArray()` para parsear array de itens de interesse
  ```typescript
  private parseItemInteresseArray(value: string | string[]): ItemInteresse[] {
    // ... implementação
  }
  ```
- **Linha 376-393**: Método `parseItemInteresse()` para parsear item de interesse individual
  ```typescript
  private parseItemInteresse(value: string): ItemInteresse | null {
    // ... implementação com mapeamento de valores
  }
  ```

**Ação**: 
- Remover comentário sobre mapeamento de Raça
- Remover mapeamento da coluna "Raça" da planilha
- Remover conversão de Raça para itens_interesse
- Remover métodos `parseItemInteresseArray()` e `parseItemInteresse()` se não forem mais utilizados

---

### 5. BACKEND - Migrações SQL

#### 5.1. `backend/src/migrations/001-create-tables.sql`
- **Linha 32**: Definição da coluna `itens_interesse` na criação da tabela
  ```sql
  itens_interesse TEXT[], -- Array de strings para multiselect
  ```

**Ação**: 
- Criar nova migração para remover a coluna `itens_interesse`
- **NOTA**: Não modificar migrações antigas, criar nova migração

---

#### 5.2. `backend/src/migrations/004-fix-leads-id-to-int.sql`
- **Linha 43**: Definição da coluna `itens_interesse` na recriação da tabela
  ```sql
  itens_interesse TEXT[],
  ```

**Ação**: 
- Criar nova migração para remover a coluna `itens_interesse`
- **NOTA**: Não modificar migrações antigas, criar nova migração

---

#### 5.3. Outros arquivos SQL que podem referenciar itens_interesse
- `INSTRUCOES_RAPIDAS_FIX.md` (linha 34)
- `SOLUCAO_ERRO_SEQUENCE.md` (linha 56)

**Ação**: Atualizar documentação se necessário, mas priorizar a criação de nova migração

---

### 6. BACKEND - Scripts de Seed

#### 6.1. `backend/src/scripts/seed.ts`
- **Linha 65**: Atribuição de itens_interesse em lead de exemplo
  ```typescript
  itens_interesse: [ItemInteresse.NELORE, ItemInteresse.NELORE_MOCHO],
  ```
- **Linha 76**: Atribuição de itens_interesse em lead de exemplo
  ```typescript
  itens_interesse: [ItemInteresse.ANGUS, ItemInteresse.BRANGUS],
  ```
- **Linha 87**: Atribuição de itens_interesse em lead de exemplo
  ```typescript
  itens_interesse: [ItemInteresse.GUZERA],
  ```

**Ação**: Remover todas as atribuições de `itens_interesse` nos objetos de exemplo

---

### 7. FRONTEND - Types

#### 7.1. `frontend/src/types/lead.ts`
- **Linha 13-27**: Enum `ItemInteresse` exportado
  ```typescript
  export enum ItemInteresse {
    GIR = 'GIR',
    // ... outros valores
  }
  ```
- **Linha 49**: Campo `itens_interesse` na interface `Lead`
  ```typescript
  itens_interesse?: ItemInteresse[]
  ```
- **Linha 83**: Campo `itens_interesse` na interface `CreateLeadDto`
  ```typescript
  itens_interesse?: ItemInteresse[]
  ```

**Ação**: 
- Remover campo `itens_interesse` das interfaces `Lead` e `CreateLeadDto`
- Avaliar se o enum `ItemInteresse` ainda é necessário (pode ser usado em outros lugares)

---

### 8. FRONTEND - Telas/Componentes

#### 8.1. `frontend/src/pages/LeadsList.tsx`
- **Linha 594-601**: Exibição de itens_interesse no card mobile (seção expandível)
  ```typescript
  <div className="lead-card-field">
    <span className="lead-card-label">Itens Interesse</span>
    <span className="lead-card-value">
      {lead.itens_interesse?.length
        ? lead.itens_interesse.map((i) => i).join(', ')
        : '-'}
    </span>
  </div>
  ```
- **Linha 727-734**: Exibição de itens_interesse no card desktop
  ```typescript
  <div className="lead-card-field">
    <span className="lead-card-label">Itens Interesse</span>
    <span className="lead-card-value">
      {lead.itens_interesse?.length
        ? lead.itens_interesse.map((i) => i).join(', ')
        : '-'}
    </span>
  </div>
  ```
- **Linha 774**: Cabeçalho da coluna "Itens Interesse" na tabela
  ```typescript
  <th>Itens Interesse</th>
  ```
- **Linha 812-816**: Exibição de itens_interesse na tabela
  ```typescript
  <td>
    {lead.itens_interesse?.length
      ? lead.itens_interesse.map((i) => i).join(', ')
      : '-'}
  </td>
  ```

**Ação**: 
- Remover exibição de itens_interesse em cards (mobile e desktop)
- Remover coluna "Itens Interesse" da tabela

---

#### 8.2. `frontend/src/components/EditLeadModal.tsx`
- **Linha 34**: Inicialização do campo itens_interesse no formData
  ```typescript
  itens_interesse: lead.itens_interesse || [],
  ```
- **Linha 158-167**: Função `handleItemInteresseChange()` para gerenciar mudanças de itens de interesse
  ```typescript
  const handleItemInteresseChange = (item: ItemInteresse, checked: boolean) => {
    setFormData((prev) => {
      const current = prev.itens_interesse || []
      if (checked) {
        return { ...prev, itens_interesse: [...current, item] }
      } else {
        return { ...prev, itens_interesse: current.filter((i) => i !== item) }
      }
    })
  }
  ```
- **Linha 342-355**: Campo de seleção de itens de interesse (multiselect com checkboxes)
  ```typescript
  <div>
    <label>Itens de Interesse (multiselect)</label>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
      {Object.values(ItemInteresse).map((item) => (
        <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={formData.itens_interesse?.includes(item) || false}
            onChange={(e) => handleItemInteresseChange(item, e.target.checked)}
          />
          <span>{item}</span>
        </label>
      ))}
    </div>
  </div>
  ```

**Ação**: 
- Remover inicialização de itens_interesse no formData
- Remover função `handleItemInteresseChange()`
- Remover campo de seleção de itens de interesse do formulário

---

#### 8.3. `frontend/src/pages/LeadForm.tsx`
- **Linha 58**: Inicialização do campo itens_interesse no formData
  ```typescript
  itens_interesse: lead.itens_interesse || [],
  ```
- **Linha 84-94**: Função `handleItemInteresseChange()` para gerenciar mudanças de itens de interesse
  ```typescript
  const handleItemInteresseChange = (item: ItemInteresse, checked: boolean) => {
    setFormData((prev) => {
      const current = prev.itens_interesse || []
      if (checked) {
        return { ...prev, itens_interesse: [...current, item] }
      } else {
        return { ...prev, itens_interesse: current.filter((i) => i !== item) }
      }
    })
  }
  ```
- **Linha 227-240**: Campo de seleção de itens de interesse (multiselect com checkboxes)
  ```typescript
  <div className="form-group">
    <label>Itens de Interesse (multiselect)</label>
    <div className="checkbox-group">
      {Object.values(ItemInteresse).map((item) => (
        <label key={item} className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.itens_interesse?.includes(item) || false}
            onChange={(e) => handleItemInteresseChange(item, e.target.checked)}
          />
          {item}
        </label>
      ))}
    </div>
  </div>
  ```

**Ação**: 
- Remover inicialização de itens_interesse no formData
- Remover função `handleItemInteresseChange()`
- Remover campo de seleção de itens de interesse do formulário

---

### 9. DOCUMENTAÇÃO

#### 9.1. `IMPORTACAO_LEADS.md`
- **Linha 17**: Estrutura da planilha com coluna "Raça"
- **Linha 19**: Descrição da coluna "Raça"
- **Linha 36**: Menção a "Raça: Raça/Item de interesse (será adicionado aos itens_interesse)"
- **Linha 55**: Mapeamento "Raça | itens_interesse | Array"
- **Linha 64-88**: Seção sobre valores aceitos para Itens de Interesse (campo "Raça")
- **Linha 90**: Exemplo de planilha com coluna "Raça"
- **Linha 101**: Menção a "Raça: Adiciona ao array de itens_interesse"

**Ação**: 
- Remover seção sobre Itens de Interesse/Raça
- Atualizar exemplos de planilha removendo coluna "Raça"
- Atualizar menções a arrays de itens_interesse

---

#### 9.2. `ANALISE_IMPORTACAO_LEADS.md`
- **Linha 29**: Mapeamento de Raça → `leads.itens_interesse[]` (array)

**Ação**: 
- Confirmar remoção do mapeamento
- Marcar item do checklist como concluído

---

#### 9.3. `API_EXAMPLES.md`
- **Linha 118**: Exemplo de resposta da API com campo `itens_interesse`
  ```json
  "itens_interesse": ["NELORE", "NELORE_MOCHO"],
  ```
- **Linha 155**: Exemplo de criação de lead com campo `itens_interesse`
  ```json
  "itens_interesse": ["NELORE", "ANGUS"],
  ```
- **Linha 206-220**: Seção completa sobre ItemInteresse com todos os valores possíveis
  ```markdown
  ### ItemInteresse
  - `GIR`
  - `GUZERA`
  - `INDUBRASIL`
  - ... (todos os valores)
  ```

**Ação**: 
- Remover campo `itens_interesse` de todos os exemplos de API
- Atualizar exemplos de criação de leads
- Remover seção completa sobre ItemInteresse

---

#### 9.4. `README.md`
- **Linha 173**: Menção a `itens_interesse`: Multiselect (array)

**Ação**: 
- Remover menção a `itens_interesse` se existir

---

## 📊 Resumo por Categoria

| Categoria | Arquivos | Ocorrências |
|-----------|----------|-------------|
| **Backend - Entity** | 1 | 2 (coluna + enum) |
| **Backend - Service** | 1 | 1 (importação) |
| **Backend - DTOs** | 3 | 3 campos |
| **Backend - Import Service** | 1 | 6 (comentários + mapeamento + 2 métodos) |
| **Backend - Migrações SQL** | 2 | 2 colunas |
| **Backend - Scripts** | 1 | 3 atribuições |
| **Frontend - Types** | 1 | 3 (enum + 2 interfaces) |
| **Frontend - Telas** | 1 | 4 ocorrências |
| **Frontend - Componentes** | 2 | 6 ocorrências |
| **Documentação** | 4 | ~18 ocorrências |
| **TOTAL** | **17 arquivos** | **~48 ocorrências** |

---

## ⚠️ Observações Importantes

1. **Migrações SQL**: Não modificar migrações antigas. Criar uma nova migração para remover a coluna.

2. **Enum ItemInteresse**: Avaliar se ainda é necessário após a remoção. Pode ser usado em outros contextos não relacionados à coluna `itens_interesse` da tabela `leads`.

3. **Importação de Planilhas**: A coluna "Raça" nas planilhas de importação não será mais processada. Atualizar documentação e considerar avisar usuários.

4. **Dados Existentes**: Considerar migração de dados se houver necessidade de preservar valores antigos da coluna `itens_interesse` antes de removê-la.

5. **Testes**: Verificar se há testes unitários ou de integração que referenciam a coluna `itens_interesse` e atualizá-los.

---

## ✅ Checklist de Remoção

- [ ] Backend: Remover coluna da entidade Lead
- [ ] Backend: Remover atribuição de itens_interesse na importação
- [ ] Backend: Remover campo itens_interesse dos DTOs (Create, Update, Import)
- [ ] Backend: Remover métodos de parse de itens de interesse no import service
- [ ] Backend: Remover mapeamento da coluna "Raça" da planilha
- [ ] Backend: Criar migração SQL para remover coluna
- [ ] Backend: Remover atribuições de itens_interesse no script de seed
- [ ] Frontend: Remover campo itens_interesse dos types/interfaces
- [ ] Frontend: Remover exibição de itens_interesse em cards e tabela
- [ ] Frontend: Remover campo de itens_interesse em EditLeadModal
- [ ] Frontend: Remover campo de itens_interesse em LeadForm
- [ ] Documentação: Atualizar IMPORTACAO_LEADS.md
- [ ] Documentação: Atualizar ANALISE_IMPORTACAO_LEADS.md
- [ ] Documentação: Atualizar API_EXAMPLES.md (remover itens_interesse dos exemplos)
- [ ] Documentação: Atualizar README.md se necessário
- [ ] Testes: Verificar e atualizar testes se necessário

---

**Data do Mapeamento**: 2025-01-27
**Status**: ✅ Mapeamento Completo - Aguardando Aprovação para Implementação

