# 🔍 Análise do Problema de Cache no Kanban

## Problema Relatado
Os cards são movidos entre boards e as informações são gravadas corretamente no banco de dados, mas permanecem visíveis no board de origem mesmo após atualizar a página. O front-end demora muito para refletir as mudanças.

---

## 📋 Problemas Identificados

### 1. **React Query sem Configuração de Cache** ⚠️ **CRÍTICO**

**Localização:** `frontend/src/main.tsx:10`

**Problema:**
```typescript
const queryClient = new QueryClient() // Sem configuração!
```

O React Query v5 está usando valores padrão:
- `staleTime`: 0 (dados são considerados "stale" imediatamente)
- `gcTime` (antes cacheTime): 5 minutos (dados ficam no cache por 5 minutos)
- `refetchOnMount`: true
- `refetchOnWindowFocus`: true

**Impacto:** 
- Dados podem ficar no cache por até 5 minutos após serem considerados "stale"
- Mesmo que o React Query tente refetch, o navegador/proxy podem estar servindo dados em cache

---

### 2. **Falta de Headers Cache-Control no Backend** ⚠️ **CRÍTICO**

**Localização:** `backend/src/main.ts`

**Problema:**
O backend não está enviando headers `Cache-Control` nas respostas da API. Isso permite que:
- Navegadores cacheiem respostas JSON
- Proxies intermediários (Apache, CDN) cacheiem respostas
- Dados antigos sejam servidos mesmo após mudanças no banco

**Impacto:**
Mesmo que o React Query tente refetch, o navegador ou proxy podem retornar dados em cache.

---

### 3. **Apache Proxy sem Headers de No-Cache para /api** ⚠️ **ALTO**

**Localização:** `frontend/.htaccess`

**Problema:**
O arquivo `.htaccess` não está configurando headers `Cache-Control` para rotas `/api/*`. O proxy reverso pode estar cacheando respostas da API.

**Impacto:**
O Apache pode estar servindo respostas em cache mesmo quando o backend retorna dados atualizados.

---

### 4. **Invalidação Incompleta após Mover Lead** ⚠️ **ALTO**

**Localização:** `frontend/src/pages/KanbanAdmin.tsx:245-248`

**Problema:**
```typescript
onSuccess: () => {
  // Apenas invalida a query de boards para atualizar contadores (mais leve)
  queryClient.invalidateQueries({ queryKey: ['kanban-boards-admin'] })
  toast.success('Lead movido com sucesso!')
}
```

**Impacto:**
- A query `['kanban-board-leads-all']` NÃO está sendo invalidada após mover um lead
- A atualização otimista funciona, mas se o usuário recarregar a página ou se houver algum problema, os dados podem estar desatualizados
- O mesmo problema existe em `KanbanColaborador.tsx` e provavelmente em `KanbanAgente.tsx`

---

### 5. **Atualização Otimista Pode Ficar Desatualizada** ⚠️ **MÉDIO**

**Localização:** `frontend/src/pages/KanbanAdmin.tsx:204-241`

**Problema:**
A atualização otimista atualiza múltiplas queries, mas se alguma query não for atualizada corretamente (por exemplo, se tiver uma queryKey diferente), os dados podem ficar desatualizados.

**Impacto:**
Se o usuário tiver múltiplas abas abertas ou se houver queries com keys diferentes, os dados podem ficar inconsistentes.

---

## ✅ Soluções Propostas

### Solução 1: Configurar React Query com Cache Adequado

**Arquivo:** `frontend/src/main.tsx`

**Mudança:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Dados são stale imediatamente (precisa refetch)
      gcTime: 0, // Remove dados do cache imediatamente após serem unused (antes cacheTime: 0)
      refetchOnMount: true, // Sempre refetch ao montar componente
      refetchOnWindowFocus: true, // Refetch ao focar na janela
      refetchOnReconnect: true, // Refetch ao reconectar
      retry: 1,
    },
  },
})
```

**OU (mais agressivo):**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 0,
      refetchOnMount: 'always',
      refetchOnWindowFocus: 'always',
      refetchOnReconnect: 'always',
      retry: 1,
    },
  },
})
```

---

### Solução 2: Adicionar Headers Cache-Control no Backend

**Arquivo:** `backend/src/main.ts`

**Mudança:**
Adicionar middleware global que adiciona headers `Cache-Control: no-cache, no-store, must-revalidate` para todas as respostas da API:

```typescript
// Adicionar após app.setGlobalPrefix('api')
app.use((req, res, next) => {
  // Apenas para rotas da API
  if (req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});
```

**OU usar interceptor do NestJS:**
```typescript
// Criar interceptor: backend/src/common/interceptors/no-cache.interceptor.ts
// E aplicar globalmente no main.ts
```

---

### Solução 3: Configurar Headers no Apache para /api

**Arquivo:** `frontend/.htaccess`

**Mudança:**
Adicionar na seção `<IfModule mod_headers.c>`:

```apache
# Desabilitar cache para rotas da API
<LocationMatch "^/api/">
  Header set Cache-Control "no-cache, no-store, must-revalidate"
  Header set Pragma "no-cache"
  Header set Expires "0"
</LocationMatch>
```

**OU (se LocationMatch não funcionar):**
```apache
# Desabilitar cache para rotas da API
<IfModule mod_headers.c>
  SetEnvIf Request_URI "^/api/" API_REQUEST
  Header set Cache-Control "no-cache, no-store, must-revalidate" env=API_REQUEST
  Header set Pragma "no-cache" env=API_REQUEST
  Header set Expires "0" env=API_REQUEST
</IfModule>
```

---

### Solução 4: Invalidar Query de Leads após Mover Lead

**Arquivos:**
- `frontend/src/pages/KanbanAdmin.tsx`
- `frontend/src/pages/KanbanColaborador.tsx`
- `frontend/src/pages/KanbanAgente.tsx`

**Mudança:**
No `onSuccess` de `moveLeadMutation`, invalidar também a query de leads:

```typescript
onSuccess: () => {
  // Invalida queries de boards E leads
  queryClient.invalidateQueries({ queryKey: ['kanban-boards-admin'] })
  queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all'] })
  toast.success('Lead movido com sucesso!')
}
```

**Para KanbanColaborador:**
```typescript
queryClient.invalidateQueries({ queryKey: ['kanban-boards-colaborador'] })
queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all-colaborador'] })
```

---

### Solução 5: Forçar Refetch após Invalidação (Opcional)

**Melhoria:**
Após invalidar, forçar refetch imediato:

```typescript
onSuccess: async () => {
  // Invalida e refetch imediatamente
  await queryClient.invalidateQueries({ queryKey: ['kanban-boards-admin'] })
  await queryClient.invalidateQueries({ queryKey: ['kanban-board-leads-all'] })
  await queryClient.refetchQueries({ queryKey: ['kanban-board-leads-all'] })
  toast.success('Lead movido com sucesso!')
}
```

---

## 🎯 Plano de Implementação Recomendado

### Fase 1: Backend (Prioridade Alta)
1. ✅ Adicionar headers `Cache-Control` no backend para todas as rotas `/api`
2. ✅ Testar que os headers estão sendo enviados corretamente

### Fase 2: Apache (Prioridade Alta)
3. ✅ Adicionar headers `Cache-Control` no `.htaccess` para rotas `/api/*`
4. ✅ Testar que o proxy não está cacheando respostas

### Fase 3: Frontend - React Query (Prioridade Alta)
5. ✅ Configurar `QueryClient` com `gcTime: 0` e `staleTime: 0`
6. ✅ Testar que os dados não ficam em cache desnecessariamente

### Fase 4: Frontend - Invalidação (Prioridade Média)
7. ✅ Adicionar invalidação de queries de leads após mover lead
8. ✅ Testar que os dados são atualizados imediatamente

---

## 🔬 Testes Recomendados

1. **Teste de Cache do Navegador:**
   - Mover um lead entre boards
   - Abrir DevTools → Network
   - Verificar headers `Cache-Control` nas respostas da API
   - Recarregar a página (F5)
   - Verificar que os dados estão corretos

2. **Teste de Cache do Proxy:**
   - Mover um lead entre boards
   - Verificar no backend (logs/database) que a mudança foi salva
   - Fazer requisição direta à API (curl/Postman) passando pelo proxy
   - Verificar que a resposta não está em cache

3. **Teste de React Query:**
   - Mover um lead entre boards
   - Verificar no DevTools → React Query DevTools que as queries foram invalidadas
   - Verificar que os dados são refetchados imediatamente

---

## 📝 Notas Adicionais

- **React Query v5:** Mudou `cacheTime` para `gcTime`, mas a funcionalidade é similar
- **KingHost:** Pode ter cache adicional em nível de infraestrutura. Verificar com suporte se necessário
- **Service Workers:** Não foram encontrados, mas verificar se não há registro de service worker no navegador

---

## 🚨 Ação Imediata

**Problema mais crítico:** Falta de headers `Cache-Control` no backend e no Apache.

**Solução rápida:** Implementar Soluções 1, 2 e 3 primeiro, pois são as que têm maior impacto.

