# Análise: Exibir Data da Última Ocorrência nos Cards de Leads

## Objetivo
Substituir a exibição de `leads.data_entrada` pela data da última ocorrência (`occurrences.created_at`) nos cards de leads das telas:
- `KanbanAdmin`
- `KanbanAgente`
- `KanbanColaborador`

## Estrutura Atual

### Frontend
- **Arquivos afetados:**
  - `frontend/src/pages/KanbanAdmin.tsx` (linha ~1016-1023)
  - `frontend/src/pages/KanbanAgente.tsx` (linha ~1070-1077)
  - `frontend/src/pages/KanbanColaborador.tsx` (linha ~1160-1167)

- **Campo atual exibido:**
  ```tsx
  {lead.data_entrada && (
    <span className="card-data-entrada" title="Data de entrada do lead">
      {new Date(lead.data_entrada).toLocaleDateString('pt-BR')}
    </span>
  )}
  ```

### Backend
- **Método principal:** `KanbanBoardsService.getLeadsByBoard()`
- **Endpoint:** `GET /kanban-boards/:id/leads`
- **Localização:** `backend/src/kanban-boards/kanban-boards.service.ts` (linha ~1008-1488)

### Estrutura do Banco de Dados

#### Tabela `occurrences`
```sql
CREATE TABLE occurrences (
    id SERIAL PRIMARY KEY,
    leads_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    usuarios_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    texto TEXT NOT NULL,
    tipo VARCHAR(50) CHECK (tipo IN ('SISTEMA', 'USUARIO')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Índices existentes:
- ✅ `idx_occurrences_leads_id` - Índice em `leads_id` (já existe, otimiza buscas por lead)
- ✅ `idx_occurrences_usuarios_id` - Índice em `usuarios_id`
- ✅ `idx_occurrences_tipo` - Índice em `tipo`

**⚠️ Observação:** Não há índice composto em `(leads_id, created_at)`, mas o índice em `leads_id` já ajuda bastante.

## Análise de Performance

### Cenário Atual
O método `getLeadsByBoard` já implementa estratégias de otimização:
1. **Carregamento em batch de produtos** (linha ~1428-1457)
2. **Carregamento em batch de relações** (linha ~1348-1426)
3. **Uso de índices** para filtros e joins

### Opções de Implementação

#### Opção 1: LEFT JOIN com Subquery (Recomendada) ⭐
**Vantagens:**
- ✅ Uma única query SQL
- ✅ Aproveita índices existentes
- ✅ Retorna dados já agregados
- ✅ Menor overhead de processamento

**Implementação:**
```sql
LEFT JOIN LATERAL (
    SELECT created_at 
    FROM occurrences 
    WHERE occurrences.leads_id = lead.id 
    ORDER BY created_at DESC 
    LIMIT 1
) last_occurrence ON true
```

**Ou usando MAX:**
```sql
LEFT JOIN (
    SELECT leads_id, MAX(created_at) as last_occurrence_date
    FROM occurrences
    GROUP BY leads_id
) last_occurrence ON last_occurrence.leads_id = lead.id
```

**Performance:** ⭐⭐⭐⭐⭐ (Excelente)
- Usa o índice `idx_occurrences_leads_id`
- PostgreSQL otimiza bem subqueries correlacionadas
- Retorna apenas o valor necessário

#### Opção 2: Carregamento em Batch (Similar a Produtos)
**Vantagens:**
- ✅ Consistente com o padrão atual do código
- ✅ Facilita debug e manutenção
- ✅ Permite tratamento de erros isolado

**Implementação:**
```typescript
// Após buscar os leads (linha ~1345)
if (leads.length > 0) {
  const leadIds = leads.map(lead => lead.id);
  
  // Busca última ocorrência para cada lead
  const lastOccurrences = await this.occurrencesRepository
    .createQueryBuilder('occ')
    .select('occ.leads_id', 'lead_id')
    .addSelect('MAX(occ.created_at)', 'last_occurrence_date')
    .where('occ.leads_id IN (:...leadIds)', { leadIds })
    .groupBy('occ.leads_id')
    .getRawMany();
  
  // Mapeia para cada lead
  const occurrencesMap = new Map<number, Date>();
  lastOccurrences.forEach(occ => {
    occurrencesMap.set(occ.lead_id, occ.last_occurrence_date);
  });
  
  leads.forEach(lead => {
    (lead as any).ultima_ocorrencia_date = occurrencesMap.get(lead.id) || null;
  });
}
```

**Performance:** ⭐⭐⭐⭐ (Muito Boa)
- Uma query adicional, mas em batch
- Usa o índice `idx_occurrences_leads_id`
- Processamento em memória é rápido

#### Opção 3: Subquery no SELECT
**Vantagens:**
- ✅ Tudo em uma query
- ✅ Simples de implementar

**Desvantagens:**
- ⚠️ Pode ser menos eficiente para muitos leads
- ⚠️ Subquery executada para cada linha

**Implementação:**
```typescript
queryBuilder.addSelect(
  `(SELECT MAX(created_at) FROM occurrences WHERE occurrences.leads_id = lead.id)`,
  'ultima_ocorrencia_date'
);
```

**Performance:** ⭐⭐⭐ (Boa, mas pode degradar com muitos leads)

## Recomendação Final

### ⭐ Opção 2: Carregamento em Batch (Recomendada)

**Motivos:**
1. **Consistência:** Segue o mesmo padrão já usado para produtos e relações
2. **Manutenibilidade:** Código mais fácil de entender e debugar
3. **Performance:** Excelente para o caso de uso (50 leads por página)
4. **Flexibilidade:** Permite adicionar lógica adicional no futuro (ex: filtrar por tipo de ocorrência)

### Implementação Sugerida

#### Backend (`kanban-boards.service.ts`)

**✅ Verificação:** O serviço já possui `occurrencesRepository` injetado (linha ~80-81), então não é necessário adicionar novas dependências.

**Localização:** Após o carregamento de produtos (após linha ~1457)

```typescript
// Carrega última ocorrência para todos os leads de uma vez
if (leads.length > 0) {
  const leadIds = leads.map(lead => lead.id);
  
  try {
    const lastOccurrences = await this.occurrencesRepository
      .createQueryBuilder('occ')
      .select('occ.leads_id', 'lead_id')
      .addSelect('MAX(occ.created_at)', 'last_occurrence_date')
      .where('occ.leads_id IN (:...leadIds)', { leadIds })
      .groupBy('occ.leads_id')
      .getRawMany();
    
    const occurrencesMap = new Map<number, Date>();
    lastOccurrences.forEach((occ: any) => {
      occurrencesMap.set(occ.lead_id, occ.last_occurrence_date);
    });
    
    leads.forEach(lead => {
      (lead as any).ultima_ocorrencia_date = occurrencesMap.get(lead.id) || null;
    });
  } catch (error) {
    console.error('[getLeadsByBoard] Erro ao carregar últimas ocorrências:', error);
    // Continua sem as datas de ocorrência se houver erro
    leads.forEach(lead => {
      (lead as any).ultima_ocorrencia_date = null;
    });
  }
}
```

#### Frontend - Atualizar Interface TypeScript

**Arquivo:** `frontend/src/types/lead.ts`

```typescript
export interface Lead {
  // ... campos existentes ...
  ultima_ocorrencia_date?: string | null; // Data da última ocorrência
}
```

#### Frontend - Atualizar Componentes

**Arquivos:**
- `KanbanAdmin.tsx`
- `KanbanAgente.tsx`
- `KanbanColaborador.tsx`

**Mudança:**
```tsx
// ANTES
{lead.data_entrada && (
  <span className="card-data-entrada" title="Data de entrada do lead">
    {new Date(lead.data_entrada).toLocaleDateString('pt-BR')}
  </span>
)}

// DEPOIS
{(lead.ultima_ocorrencia_date || lead.data_entrada) && (
  <span 
    className="card-data-entrada"
    title={lead.ultima_ocorrencia_date 
      ? "Data da última ocorrência" 
      : "Data de entrada do lead"}
  >
    {lead.ultima_ocorrencia_date
      ? new Date(lead.ultima_ocorrencia_date).toLocaleDateString('pt-BR')
      : new Date(lead.data_entrada).toLocaleDateString('pt-BR')}
  </span>
)}
```

**Lógica de fallback:** Se não houver ocorrência, exibe `data_entrada` (comportamento atual).

## Considerações de Performance

### Impacto Esperado
- **Query adicional:** 1 query por página de leads (50 leads)
- **Tempo estimado:** < 50ms para 50 leads (com índice)
- **Uso de memória:** Mínimo (apenas um Map temporário)
- **Escalabilidade:** Excelente (índice em `leads_id` garante performance)

### Otimizações Futuras (se necessário)
1. **Índice composto:** `CREATE INDEX idx_occurrences_lead_created ON occurrences(leads_id, created_at DESC)`
   - Melhoria marginal, mas pode ajudar em casos extremos
2. **Cache:** Se necessário, pode-se cachear as últimas ocorrências
3. **Materialized View:** Para casos com milhões de registros

## Testes Recomendados

1. **Performance:**
   - Testar com 50 leads (página padrão)
   - Testar com 100+ leads
   - Verificar tempo de resposta da API

2. **Funcionalidade:**
   - Lead sem ocorrências (deve mostrar `data_entrada`)
   - Lead com uma ocorrência
   - Lead com múltiplas ocorrências (deve mostrar a mais recente)
   - Lead com ocorrências em diferentes fusos horários

3. **Edge Cases:**
   - Lead sem `data_entrada` e sem ocorrências
   - Lead com ocorrência com `created_at` NULL (não deve acontecer, mas testar)

## Resumo

- **Complexidade:** Baixa
- **Impacto na Performance:** Mínimo (1 query adicional otimizada)
- **Risco:** Baixo (fallback para `data_entrada` se houver erro)
- **Manutenibilidade:** Alta (segue padrão existente)
