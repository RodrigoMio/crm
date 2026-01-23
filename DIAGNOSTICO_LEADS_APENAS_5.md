# 🔍 Diagnóstico - Leads Listando Apenas 5 Registros

## 🔍 VERIFICAÇÃO RÁPIDA

### 1️⃣ Verificar Console do Navegador

Abra o DevTools (F12) e vá na aba **Console**. Procure por:

```
[LeadsList] Response: {...}
[LeadsList] LeadsData: {...}
[LeadsList] Leads: [...]
[LeadsList] Total: ...
```

**Verifique:**
- Quantos leads estão em `Leads`?
- Qual é o `Total`?
- Qual é o `limit` na resposta?

### 2️⃣ Verificar Network (DevTools)

1. Abra DevTools (F12)
2. Vá na aba **Network**
3. Recarregue a página
4. Procure pela requisição `leads?page=1&limit=100`
5. Clique na requisição e veja a **Response**

**Verifique:**
- Quantos registros estão em `data`?
- Qual é o `total`?
- Qual é o `limit` retornado?

### 3️⃣ Verificar Logs do Backend (SSH)

```bash
# Ver logs do PM2
pm2 logs crm --lines 100 | grep -i "leads"

# Procurar por:
# [LeadsService] Leads encontrados: X
# [LeadsService] Query SQL: ...
```

**Verifique:**
- Quantos leads foram encontrados?
- A query SQL está correta?
- O `limit` está sendo aplicado corretamente?

---

## 🐛 POSSÍVEIS CAUSAS

### Causa 1: Problema no Backend (Query Limitando)

Se o backend está retornando apenas 5, pode ser:
- Problema na query SQL
- Filtros aplicados incorretamente
- Problema de permissões (usuário vendo apenas seus leads)

**Solução:** Verificar logs do backend

### Causa 2: Problema no Frontend (Cache)

O React Query pode estar usando cache antigo.

**Solução:**
1. Limpar cache do navegador (Ctrl+Shift+Del)
2. Ou adicionar `cacheTime: 0` temporariamente na query

### Causa 3: Problema de Filtros

Alguns filtros podem estar limitando os resultados.

**Solução:** Limpar todos os filtros e testar

### Causa 4: Problema de Paginação

A paginação pode estar na página errada.

**Solução:** Verificar se `currentPage` está em 1

---

## ✅ SOLUÇÃO TEMPORÁRIA: Aumentar Limite

Se quiser testar rapidamente, aumente o `pageSize` no frontend:

**Edite `frontend/src/pages/LeadsList.tsx` linha 52:**

```typescript
const pageSize = 1000 // Aumentar temporariamente para testar
```

**Depois recompile:**
```powershell
cd frontend
npm run build
```

---

## 🔧 VERIFICAÇÃO NO BACKEND

### Verificar se o Limit Está Sendo Aplicado

Adicione logs temporários no backend para debug:

**Edite `backend/src/leads/leads.service.ts` linha 110:**

```typescript
const limit = filterDto.limit || 100;
console.log('[LeadsService] DEBUG - Limit recebido:', filterDto.limit);
console.log('[LeadsService] DEBUG - Limit aplicado:', limit);
console.log('[LeadsService] DEBUG - Page:', page);
console.log('[LeadsService] DEBUG - Skip:', skip);
```

**Recompile e faça upload:**
```powershell
cd backend
npm run build
```

**Depois verifique os logs:**
```bash
pm2 logs crm | grep "DEBUG"
```

---

## 📋 CHECKLIST DE DIAGNÓSTICO

- [ ] Console do navegador mostra quantos leads?
- [ ] Network mostra quantos leads na resposta?
- [ ] Logs do backend mostram quantos leads encontrados?
- [ ] O `limit` está sendo enviado corretamente?
- [ ] Há filtros ativos que podem estar limitando?
- [ ] Cache do navegador foi limpo?
- [ ] A paginação está na página 1?

---

## 💡 PRÓXIMOS PASSOS

1. **Execute as verificações acima**
2. **Compartilhe os resultados:**
   - Quantos leads aparecem no console?
   - Quantos leads aparecem na resposta da API?
   - Quantos leads aparecem nos logs do backend?
3. **Com essas informações, posso identificar o problema exato**






