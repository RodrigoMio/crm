# ✅ Correções na Edição de Lead

## 🔧 Problemas Corrigidos

### 1. Erro "Agente não pode alterar vendedor_id"

**Problema:**
- Campo Vendedor aparecia em branco para Agentes
- Ao salvar, dava erro mesmo sem alterar o campo
- Backend validava `vendedor_id` mesmo quando não era enviado

**Solução:**
- ✅ Frontend: Remove `vendedor_id` do payload quando for Agente/Colaborador
- ✅ Frontend: Campo Vendedor mostra valor atual do lead quando desabilitado
- ✅ Backend: Valida `vendedor_id` apenas se foi explicitamente alterado

**Arquivos Modificados:**
- `frontend/src/pages/LeadsList.tsx` - EditLeadModal
  - `handleSubmit`: Remove `vendedor_id` do payload para Agente
  - Campo Vendedor: Mostra valor atual e texto informativo

- `backend/src/leads/leads.service.ts`
  - `update`: Valida apenas se `vendedor_id` foi alterado

---

### 2. Validação de UF e Município

**Problema:**
- Campos UF e Município eram obrigatórios
- Não permitia salvar leads sem esses dados

**Solução:**
- ✅ Frontend: Removido `required` e asterisco (*) dos campos
- ✅ Backend: Tornados opcionais nos DTOs
- ✅ Entidade: Já estava como `nullable: true`

**Arquivos Modificados:**
- `frontend/src/pages/LeadsList.tsx` - EditLeadModal
  - Campos UF e Município: Removido `required` e asterisco

- `frontend/src/pages/LeadForm.tsx` - Formulário de criação
  - Campos UF e Município: Removido `required` e asterisco

- `backend/src/leads/dto/create-lead.dto.ts`
  - `uf`: Tornado opcional com `@IsOptional()`
  - `municipio`: Tornado opcional com `@IsOptional()`

---

## 📋 Mudanças Detalhadas

### Frontend - EditLeadModal

**Antes:**
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  mutation.mutate(formData) // Enviava vendedor_id mesmo para Agente
}
```

**Depois:**
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  
  // Se for Agente, remove vendedor_id do payload (não pode alterar)
  const dataToSend: any = { ...formData }
  if (user?.perfil === 'AGENTE' || user?.perfil === 'COLABORADOR') {
    delete dataToSend.vendedor_id
  }
  
  mutation.mutate(dataToSend)
}
```

**Campo Vendedor:**
```typescript
<select
  value={formData.vendedor_id || lead.vendedor_id || ''}
  required={user?.perfil === 'ADMIN'}
  disabled={user?.perfil === 'AGENTE' || user?.perfil === 'COLABORADOR'}
>
  {/* ... */}
</select>
{lead.vendedor && (
  <small>Vendedor atual: {lead.vendedor.nome}</small>
)}
```

**Campos UF e Município:**
```typescript
// Antes: required
<label>UF *</label>
<input required />

// Depois: opcional
<label>UF</label>
<input />
```

---

### Backend - LeadsService

**Antes:**
```typescript
if (updateLeadDto.vendedor_id) {
  if (currentUser.perfil === UserProfile.AGENTE) {
    throw new ForbiddenException('Agente não pode alterar vendedor_id');
  }
}
```

**Depois:**
```typescript
// Só valida se vendedor_id foi explicitamente enviado e é diferente do atual
if (updateLeadDto.vendedor_id !== undefined && updateLeadDto.vendedor_id !== lead.vendedor_id) {
  if (currentUser.perfil === UserProfile.AGENTE) {
    throw new ForbiddenException('Agente não pode alterar vendedor_id');
  }
}
```

---

### Backend - DTOs

**CreateLeadDto:**
```typescript
// Antes
@IsString()
@Length(2, 2)
uf: string;

@IsString()
@MinLength(1)
municipio: string;

// Depois
@IsOptional()
@IsString()
@Length(2, 2, { message: 'UF deve ter exatamente 2 caracteres' })
uf?: string;

@IsOptional()
@IsString()
municipio?: string;
```

---

## ✅ Resultado

### Para Agentes:
- ✅ Campo Vendedor mostra valor atual (desabilitado)
- ✅ Não envia `vendedor_id` no payload
- ✅ Pode editar outros campos normalmente
- ✅ Não dá erro ao salvar

### Para Todos:
- ✅ UF e Município são opcionais
- ✅ Pode salvar leads sem preencher esses campos
- ✅ Validação no backend permite valores vazios/null

---

## 🧪 Como Testar

1. **Login como Agente**
2. **Acesse um lead**
3. **Clique para editar**
4. **Verifique:**
   - ✅ Campo Vendedor mostra o nome do vendedor atual
   - ✅ Campo Vendedor está desabilitado
   - ✅ Campos UF e Município não têm asterisco (*)
   - ✅ Pode deixar UF e Município em branco
5. **Altere algum campo (ex: anotações)**
6. **Clique em Salvar**
7. **Verifique:**
   - ✅ Salva sem erro
   - ✅ Lead é atualizado corretamente

---

## 📝 Notas

- O campo Vendedor continua sendo obrigatório na **criação** de leads
- Apenas na **edição** que Agente não pode alterar
- UF e Município são opcionais tanto na criação quanto na edição
- Backend valida apenas se `vendedor_id` foi **alterado**, não se foi enviado

---

**Status: ✅ Correções aplicadas e prontas para deploy**









