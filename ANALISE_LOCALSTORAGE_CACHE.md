# 🔍 Análise: localStorage e Problema de Cache

## Problema Relatado
Mesmo após publicar as correções, quando o usuário move um card e faz ALT+TAB (sai e volta para o navegador), o card aparece novamente no board de origem, e só após alguns minutos volta para o board destino.

---

## 📋 Análise do localStorage

### 1. **O que está sendo armazenado no localStorage**

**Arquivo:** `frontend/src/pages/KanbanColaborador.tsx`

```typescript
const STORAGE_KEY_FILTERS = 'kanban-colaborador-filters'

// Armazena apenas filtros:
- selectedAgenteId (string)
- selectedColaboradorId (string)  
- nome_razao_social (string)
- Outros filtros de FilterLeadsDto (uf, vendedor_id, etc.)
```

**⚠️ IMPORTANTE:** O localStorage NÃO armazena dados das queries do React Query (boards, leads, etc.). Apenas armazena filtros de busca/seleção.

---

### 2. **React Query e localStorage**

**Verificação:** O React Query NÃO está configurado com persistência no localStorage.

```typescript
// frontend/src/main.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 0,  // Remove do cache imediatamente
      // NÃO há persistQueryClient ou createSyncStoragePersister
    },
  },
})
```

**Conclusão:** O localStorage NÃO está armazenando cache do React Query.

---

## 🔴 Problemas Identificados Relacionados ao localStorage

### Problema 1: **QueryKey Inclui Filtros do localStorage**

**Localização:** `frontend/src/pages/KanbanColaborador.tsx:147`

```typescript
const boardLeadsQueries = useQuery({
  queryKey: ['kanban-board-leads-all-colaborador', 
             boards.map(b => b.id).sort().join(','), 
             searchTerm,  // ← Vem do localStorage!
             currentPage],
  // ...
})
```

**Impacto:**
- Se `searchTerm` está salvo no localStorage e muda, cria uma nova queryKey
- Dados antigos podem permanecer em cache com a queryKey antiga
- Quando o filtro é restaurado do localStorage, pode usar queryKey com dados desatualizados

**Cenário de Problema:**
1. Usuário tem `searchTerm = "ABC"` no localStorage
2. Move um card (atualização otimista funciona)
3. Faz ALT+TAB → `refetchOnWindowFocus` aciona
4. A queryKey inclui `searchTerm = "ABC"` (restaurado do localStorage)
5. Se houver dados em cache com essa queryKey, podem ser dados antigos
6. O refetch pode não acontecer se os dados não forem considerados "stale"

---

### Problema 2: **Filtros Restaurados Podem Causar Queries com Keys Diferentes**

**Localização:** `frontend/src/pages/KanbanColaborador.tsx:35-55`

```typescript
// Filtros são restaurados do localStorage na inicialização
const [filters, setFilters] = useState<ExtendedFilters>(() => {
  const saved = localStorage.getItem(STORAGE_KEY_FILTERS)
  // ...
})

const searchTerm = filters.nome_razao_social || ''
```

**Cenário Problemático:**
1. Usuário move card com `searchTerm = ""` (sem busca)
2. QueryKey: `['kanban-board-leads-all-colaborador', '1,2,3', '', 1]`
3. Atualização otimista atualiza essa query
4. Usuário faz ALT+TAB
5. Componente remonta → localStorage restaura `searchTerm = "ABC"` (se havia busca salva)
6. Nova queryKey: `['kanban-board-leads-all-colaborador', '1,2,3', 'ABC', 1]`
7. Esta é uma queryKey DIFERENTE, então pode buscar dados do servidor
8. Mas a queryKey antiga (`searchTerm = ""`) ainda tem dados atualizados no cache
9. Conflito: duas queries diferentes com dados diferentes

**⚠️ Este é um problema secundário** - não explica diretamente o card aparecer no board errado.

---

### Problema 3: **QueryKey Não Inclui selectedAgenteId/selectedColaboradorId**

**Localização:** `frontend/src/pages/KanbanColaborador.tsx:127-143`

```typescript
// Query de boards inclui selectedAgenteId
queryKey: ['kanban-boards-colaborador', colaboradorId, selectedAgenteId]

// Mas query de leads NÃO inclui selectedAgenteId/selectedColaboradorId
queryKey: ['kanban-board-leads-all-colaborador', 
           boards.map(b => b.id).sort().join(','), 
           searchTerm, 
           currentPage]
```

**Problema:**
- Se o usuário mudar o Agente/Colaborador (valores vêm do localStorage)
- A query de boards muda (nova queryKey)
- Mas a query de leads pode usar dados antigos se os boards tiverem os mesmos IDs
- Exemplo: Agente A tem boards [1,2,3], Agente B também tem boards [1,2,3]
- QueryKey de leads seria a mesma: `['kanban-board-leads-all-colaborador', '1,2,3', '', 1]`
- Dados do Agente A podem ser exibidos para o Agente B!

**🔴 ESTE É UM PROBLEMA CRÍTICO!**

---

## 🔍 Problema Real: QueryKey de Leads Não Inclui Contexto de Agente/Colaborador

### Análise Detalhada

**Query de Boards:**
```typescript
queryKey: ['kanban-boards-colaborador', colaboradorId, selectedAgenteId]
// ✅ Inclui contexto (colaboradorId, selectedAgenteId)
```

**Query de Leads:**
```typescript
queryKey: ['kanban-board-leads-all-colaborador', 
           boards.map(b => b.id).sort().join(','),  // Apenas IDs dos boards
           searchTerm, 
           currentPage]
// ❌ NÃO inclui colaboradorId ou selectedAgenteId
```

### Cenário Problemático

1. **Usuário ADMIN seleciona:**
   - Agente: "Agente A"
   - Colaborador: "Colaborador 1"
   - Boards retornados: [1, 2, 3]
   - QueryKey de leads: `['kanban-board-leads-all-colaborador', '1,2,3', '', 1]`
   - Dados carregados e salvos no cache

2. **Usuário move um card:**
   - Atualização otimista funciona
   - onSuccess invalida e refetch
   - Dados atualizados no cache

3. **Usuário muda seleção:**
   - Agente: "Agente B"
   - Colaborador: "Colaborador 2"
   - Boards retornados: [1, 2, 3] (mesmos IDs!)
   - QueryKey de leads: `['kanban-board-leads-all-colaborador', '1,2,3', '', 1]`
   - **MESMA QUERYKEY!**
   - React Query retorna dados em cache do Agente A/Colaborador 1
   - Card aparece no board errado!

4. **Usuário faz ALT+TAB:**
   - `refetchOnWindowFocus` aciona
   - Mas a queryKey é a mesma
   - Se os dados não forem considerados "stale", pode não refetch
   - Ou refetch retorna dados, mas pode haver race condition com cache

---

## 🎯 Conclusão da Análise

### localStorage NÃO é a causa direta, MAS:

1. ✅ **localStorage não armazena dados de queries** - Não é o problema principal
2. ⚠️ **localStorage restaura filtros que afetam queryKey** - Pode causar problemas secundários
3. 🔴 **QueryKey de leads não inclui contexto de Agente/Colaborador** - **ESTE É O PROBLEMA PRINCIPAL**

### Problema Real

A **queryKey da query de leads não inclui `colaboradorId` e `selectedAgenteId`**, então quando diferentes Agentes/Colaboradores têm boards com os mesmos IDs, eles compartilham a mesma queryKey e, consequentemente, o mesmo cache de dados.

Isso explica:
- Por que o card aparece no board errado após ALT+TAB
- Por que o problema persiste mesmo com `gcTime: 0`
- Por que invalidação/refetch não resolve completamente

---

## ✅ Solução Necessária (NÃO IMPLEMENTAR AINDA)

A queryKey de leads deve incluir o contexto de Agente/Colaborador:

```typescript
// ANTES (ERRADO):
queryKey: ['kanban-board-leads-all-colaborador', 
           boards.map(b => b.id).sort().join(','), 
           searchTerm, 
           currentPage]

// DEPOIS (CORRETO):
queryKey: ['kanban-board-leads-all-colaborador', 
           colaboradorId,        // ← ADICIONAR
           selectedAgenteId,     // ← ADICIONAR (se ADMIN)
           boards.map(b => b.id).sort().join(','), 
           searchTerm, 
           currentPage]
```

Isso garantirá que cada combinação de Agente/Colaborador tenha sua própria queryKey e cache separado.

---

## 📝 Resumo

| Item | Status | Impacto |
|------|--------|---------|
| localStorage armazena queries | ❌ Não | Não é problema |
| localStorage restaura filtros | ✅ Sim | Problema secundário |
| QueryKey não inclui contexto | 🔴 **SIM** | **PROBLEMA PRINCIPAL** |
| Cache compartilhado entre usuários | 🔴 **SIM** | **CAUSA DO BUG** |

**Conclusão:** O problema NÃO é diretamente o localStorage, mas a queryKey que não diferencia entre diferentes Agentes/Colaboradores, causando cache compartilhado incorretamente.




