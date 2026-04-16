# Análise: Filtro de Leads Expirados por Board

## Objetivo
Implementar sistema de alerta e filtro para leads que estão há muito tempo sem interação (ocorrências) em um board específico.

## Requisitos Identificados

### 1. Estrutura do Banco de Dados
- ✅ Coluna `limit_days INTEGER DEFAULT 0` já criada na tabela `kanban_boards`
- ⚠️ **Pendente:** Adicionar campo na entidade TypeORM `KanbanBoard`
- ⚠️ **Pendente:** Adicionar campo na interface TypeScript `KanbanBoard`

### 2. Cálculo de Expiração
**Fórmula proposta:**
```
Data de referência = MAX(ultima_ocorrencia_date, data_entrada)
Dias sem interação = CURRENT_DATE - Data de referência
Lead expirado = Dias sem interação > limit_days
```

**Dúvidas:**
1. Se `limit_days = 0`, o board não deve ter filtro? (não exibir botão)
2. Se `limit_days = 0`, mas há leads sem ocorrência, como tratar?
3. A comparação deve ser `>=` ou `>`? (ex: se limit_days=5, no 6º dia está expirado?)

### 3. Localização do Botão
**Estrutura atual do header:**
```tsx
<div className="kanban-board-header">
  <span className="board-name">{board.nome}</span>
  <div className="board-header-actions"> {/* ou apenas <div> */}
    <button className="btn-add-lead">+</button>
    {/* outros botões */}
  </div>
</div>
```

**Posição do botão:**
- Deve ficar dentro de `board-header-actions` (ou `div` equivalente)
- Ícone warning laranja
- Sempre visível quando houver leads expirados no board

### 4. Lógica de Exibição do Botão
**Condições:**
- ✅ `limit_days > 0` (board tem limite configurado)
- ✅ Existe pelo menos 1 lead expirado no board atual
- ✅ Botão sempre visível (não apenas no hover)

**Dúvidas:**
1. O botão deve aparecer mesmo quando o board está minimizado? (KanbanColaborador)
2. Se não houver leads expirados, o botão não aparece?

### 5. Estado do Filtro
**Gerenciamento:**
- Estado por board (cada board tem seu próprio filtro independente)
- Usar `useState` com Map ou objeto: `Map<boardId, boolean>`
- Estado inicial: `false` (mostrar todos)

**Dúvidas:**
1. O estado deve persistir ao trocar de página/filtros?
2. O estado deve resetar ao recarregar a página?
3. O estado deve resetar ao mudar de tipo_fluxo?

### 6. Filtro de Leads Expirados
**Implementação:**
- **Frontend:** Filtrar array de leads após receber do backend
- **Backend:** Não precisa modificar (já retorna todos os leads)

**Lógica:**
```typescript
const isExpired = (lead: Lead, board: KanbanBoard): boolean => {
  if (!board.limit_days || board.limit_days === 0) return false;
  
  const referenceDate = lead.ultima_ocorrencia_date 
    ? new Date(lead.ultima_ocorrencia_date)
    : new Date(lead.data_entrada);
  
  const daysDiff = Math.floor(
    (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysDiff > board.limit_days; // ou >= ?
}
```

**Dúvidas:**
1. A comparação deve considerar horas/minutos ou apenas dias completos?
2. Se `ultima_ocorrencia_date` for null, usar `data_entrada` sempre?

### 7. Visual dos Cards Expirados
**Estilos necessários:**
- Borda laranja: `border: 2px solid orange;` ou `border-color: orange;`
- Ícone warning laranja: provavelmente no `card-footer` próximo à data

**Dúvidas:**
1. O ícone deve substituir o ícone atual ou ficar ao lado?
2. A borda deve ser em todo o card ou apenas em uma parte específica?
3. Qual a cor exata do laranja? (ex: `#ff9800`, `#ffa500`, `orange`)

### 8. Estrutura dos Componentes

#### Backend
1. **Entidade:** Adicionar `limit_days` em `KanbanBoard`
2. **DTO:** Adicionar `limit_days` nos DTOs se necessário
3. **Service:** Não precisa modificar (já retorna board com limit_days)

#### Frontend
1. **Types:** Adicionar `limit_days?: number` em `KanbanBoard`
2. **KanbanAdmin:** 
   - Adicionar estado de filtro por board
   - Adicionar botão no header
   - Filtrar leads antes de renderizar
   - Adicionar estilos para cards expirados
3. **KanbanAgente:** Mesmas mudanças
4. **KanbanColaborador:** Mesmas mudanças

### 9. Performance
**Considerações:**
- Cálculo de expiração é feito no frontend (O(n) onde n = número de leads)
- Para 50 leads por board, impacto mínimo
- Filtro é aplicado após receber dados (não precisa nova query)

### 10. Ícone Warning
**Opções:**
1. Usar SVG inline (como outros ícones no código)
2. Usar biblioteca de ícones (se já estiver sendo usada)
3. Usar emoji ⚠️ (não recomendado)

**Recomendação:** SVG inline para consistência

## Respostas Recebidas ✅

### 1. Cálculo de Expiração ✅
- **Fórmula:** `(data atual - data referência) > limit_days`
- **Operador:** Usar `>` (maior que, não maior ou igual)
- **Data de referência:** `MAX(ultima_ocorrencia_date, data_entrada)`

### 2. Comportamento quando `limit_days = 0` ✅
- **Não exibir o botão** - Desconsiderar todas as regras

### 3. Estado do Filtro ✅
- **Persistir ao mudar de página/filtros:** Sim
- **Resetar ao mudar de tipo_fluxo:** Não
- **Resetar ao recarregar a página:** Não
- **Implementação:** Usar `localStorage` (padrão já usado no projeto)

### 4. Posição do Ícone Warning ✅
- **No header do board:** Após o botão "Adicionar/Remover Tags" (se existir)
- **No card:** Não substituir elemento existente, não adicionar no card-footer
- **Borda:** Apenas em volta da data (`card-data-entrada`)

### 5. Estilos ✅
- **Cor laranja:** `#ff9800`
- **Borda:** `1px solid #ff9800` apenas em volta da data
- **Tooltip:** "Exibir somente expirados" / "Exibir todos os leads"

## Respostas Finais Recebidas ✅

### 1. Posição do Botão no Header ✅
- **Posição:** Antes do contador (`board-count`)
- **Visibilidade:** Sempre visível (não apenas no hover)
- **Aplicar em:** Todas as telas (KanbanAdmin, KanbanAgente, KanbanColaborador)

### 2. Ícone Warning ✅
- **Dois ícones:**
  1. **No header do board:** Indicando que existem leads com datas expiradas no board
  2. **No card (ao lado da data):** Indicando que aquele lead específico está expirado
- **Borda:** `1px solid #ff9800` apenas em volta da data (elemento `card-data-entrada`)
- **Posição no card:** Ao lado da data no `card-footer`

### 3. Persistência do Estado ✅
- **Chave específica por tela:**
  - `kanban-admin-expired-filter`
  - `kanban-agente-expired-filter`
  - `kanban-colaborador-expired-filter`
- **Formato:** `Map<boardId, boolean>` serializado como JSON

## Estrutura de Implementação Final

### Backend
1. Adicionar campo `limit_days` na entidade `KanbanBoard`
2. Adicionar campo na interface TypeScript `KanbanBoard`

### Frontend - Função Helper
```typescript
const isLeadExpired = (lead: Lead, board: KanbanBoard): boolean => {
  if (!board.limit_days || board.limit_days === 0) return false;
  
  const referenceDate = lead.ultima_ocorrencia_date 
    ? new Date(lead.ultima_ocorrencia_date)
    : new Date(lead.data_entrada);
  
  const daysDiff = Math.floor(
    (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysDiff > board.limit_days;
};
```

### Frontend - Estado e Persistência
```typescript
// Chave específica por tela
const STORAGE_KEY_EXPIRED_FILTER = 'kanban-admin-expired-filter'; // ou agente/colaborador

// Estado inicial do localStorage
const [expiredFilterActive, setExpiredFilterActive] = useState<Map<number, boolean>>(() => {
  const saved = localStorage.getItem(STORAGE_KEY_EXPIRED_FILTER);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return new Map(Object.entries(parsed).map(([k, v]) => [Number(k), v as boolean]));
    } catch {
      return new Map();
    }
  }
  return new Map();
});

// Salvar no localStorage quando mudar
useEffect(() => {
  const obj = Object.fromEntries(expiredFilterActive);
  localStorage.setItem(STORAGE_KEY_EXPIRED_FILTER, JSON.stringify(obj));
}, [expiredFilterActive]);
```

### Frontend - Botão no Header
```tsx
{/* Antes do board-count */}
{board.limit_days > 0 && hasExpiredLeads && (
  <button
    className="btn-expired-filter"
    onClick={(e) => {
      e.stopPropagation();
      toggleExpiredFilter(board.id);
    }}
    title={expiredFilterActive.get(board.id) 
      ? "Exibir todos os leads" 
      : "Exibir somente expirados"}
    style={{
      backgroundColor: expiredFilterActive.get(board.id) ? 'white' : 'transparent'
    }}
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff9800" strokeWidth="2">
      {/* Ícone warning */}
    </svg>
  </button>
)}
```

### Frontend - Card com Ícone e Borda
```tsx
<div className="card-footer">
  <AppointmentBadge leadId={lead.id} />
  {(lead.ultima_ocorrencia_date || lead.data_entrada) && (
    <span 
      className={`card-data-entrada ${isExpired ? 'card-data-expired' : ''}`}
      title={lead.ultima_ocorrencia_date 
        ? "Data da última ocorrência" 
        : "Data de entrada do lead"}
    >
      {isExpired && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff9800">
          {/* Ícone warning */}
        </svg>
      )}
      {lead.ultima_ocorrencia_date
        ? new Date(lead.ultima_ocorrencia_date).toLocaleDateString('pt-BR')
        : new Date(lead.data_entrada).toLocaleDateString('pt-BR')}
    </span>
  )}
</div>
```

### CSS
```css
.btn-expired-filter {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  border-radius: 4px;
  transition: background-color 0.2s;
  /* Sempre visível */
  opacity: 1;
}

.btn-expired-filter:hover {
  background-color: rgba(255, 152, 0, 0.1);
}

.card-data-expired {
  border: 1px solid #ff9800;
  border-radius: 4px;
  padding: 2px 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
```

### 🟡 Importantes (melhorar implementação)

5. **Cor exata do laranja:**
   - Qual código de cor usar? (ex: `#ff9800`)

6. **Estilo da borda:**
   - Espessura? (2px, 3px?)
   - Tipo? (solid, dashed?)
   - Todo o card ou apenas parte?

7. **Tooltip do botão:**
   - Texto exato: "Exibir somente expirados" / "Exibir todos os leads"
   - Ou variações?

### 🟢 Menores (pode decidir durante implementação)

8. **Ícone warning:**
   - Tamanho? (16px, 18px, 20px?)
   - Posição no header? (antes/depois dos outros botões?)

9. **Animação/transição:**
   - Adicionar transição ao alternar filtro?
   - Adicionar animação ao aparecer/desaparecer botão?

## Estrutura de Implementação Proposta

### Backend
```typescript
// kanban-board.entity.ts
@Column({ type: 'integer', default: 0, name: 'limit_days' })
limit_days: number;
```

### Frontend
```typescript
// types/kanban-board.ts
export interface KanbanBoard {
  // ... campos existentes
  limit_days?: number;
}

// Função helper
const isLeadExpired = (lead: Lead, board: KanbanBoard): boolean => {
  if (!board.limit_days || board.limit_days === 0) return false;
  
  const referenceDate = lead.ultima_ocorrencia_date 
    ? new Date(lead.ultima_ocorrencia_date)
    : new Date(lead.data_entrada);
  
  const daysDiff = Math.floor(
    (Date.now() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysDiff > board.limit_days;
};

// Estado
const [expiredFilterActive, setExpiredFilterActive] = useState<Map<number, boolean>>(new Map());

// Filtro
const filteredLeads = expiredFilterActive.get(board.id)
  ? leads.filter(lead => isLeadExpired(lead, board))
  : leads;
```

## Próximos Passos

1. ✅ Aguardar esclarecimento das dúvidas críticas
2. Adicionar campo `limit_days` na entidade e interface
3. Implementar função de cálculo de expiração
4. Adicionar botão no header dos boards
5. Implementar estado de filtro por board
6. Aplicar filtro na renderização dos leads
7. Adicionar estilos para cards expirados
8. Testar em todos os três componentes (Admin, Agente, Colaborador)
