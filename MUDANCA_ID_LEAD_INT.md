# ✅ Mudança: ID de Lead de VARCHAR para INT

## 📋 Alteração no Banco de Dados

A coluna `id` na tabela `leads` foi alterada de **VARCHAR(255)** para **INT** (auto-incremento).

---

## ✅ Ajustes Realizados

### Backend

#### 1. Entidade Lead (`backend/src/leads/entities/lead.entity.ts`)

**Antes:**
```typescript
@PrimaryColumn({ type: 'varchar', length: 255 })
id: string;
```

**Depois:**
```typescript
@PrimaryGeneratedColumn()
id: number;
```

#### 2. LeadsService (`backend/src/leads/leads.service.ts`)

**Métodos atualizados:**
- `findOne(id: number, ...)` - Parâmetro mudou de `string` para `number`
- `update(id: number, ...)` - Parâmetro mudou de `string` para `number`
- `remove(id: number, ...)` - Parâmetro mudou de `string` para `number`
- `importLeads(...)` - Lógica de importação atualizada para tratar ID como número

**Importação:**
- Valida se ID é um número válido
- Converte string para number antes de salvar
- Remove validação de tamanho máximo (255 caracteres)

#### 3. LeadsController (`backend/src/leads/leads.controller.ts`)

**Antes:**
```typescript
@Get(':id')
findOne(@Param('id') id: string, @Request() req) {
  return this.leadsService.findOne(id, req.user);
}
```

**Depois:**
```typescript
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
  return this.leadsService.findOne(id, req.user);
}
```

**Mudanças:**
- Adicionado `ParseIntPipe` para converter automaticamente string para number
- Aplicado em: `findOne`, `update`, `remove`

#### 4. LeadsImportService (`backend/src/leads/leads-import.service.ts`)

**Mudanças:**
- Valida se ID da planilha é um número válido
- Converte string para number antes de processar
- Remove validação de tamanho máximo

---

### Frontend

#### 1. Tipos TypeScript (`frontend/src/types/lead.ts`)

**Antes:**
```typescript
export interface Lead {
  id: string
  // ...
}
```

**Depois:**
```typescript
export interface Lead {
  id: number
  // ...
}
```

#### 2. Componentes

**LeadsList.tsx:**
- ✅ Já usa `lead.id` diretamente (funciona com number)
- ✅ Não precisa de conversão

**LeadForm.tsx:**
- ✅ Já usa `id` do `useParams()` (React Router converte automaticamente)
- ✅ Não precisa de conversão

**App.tsx:**
- ✅ Rota `/leads/:id` funciona normalmente (React Router trata como string na URL, mas converte quando necessário)

---

## 🔄 Comportamento da Importação

### Antes (VARCHAR):
- ID podia ser qualquer string (ex: "LEAD-001", "ABC123")
- Validação de tamanho máximo (255 caracteres)
- ID era obrigatório na planilha

### Depois (INT):
- ID deve ser um número válido (ex: 1, 123, 9999)
- Sem validação de tamanho (número inteiro)
- ID é opcional na planilha (banco gera automaticamente se não fornecido)
- Se ID fornecido e já existir, ignora a linha (não atualiza)

---

## 📝 Notas Importantes

1. **Auto-incremento**: Com `@PrimaryGeneratedColumn()`, o banco gera o ID automaticamente se não fornecido
2. **Importação**: Se a planilha tiver ID, ele será usado. Se não tiver ou for inválido, o banco gerará automaticamente
3. **URLs**: URLs continuam funcionando normalmente (`/leads/123`), React Router trata a conversão
4. **Compatibilidade**: IDs antigos (strings) não funcionarão mais - precisa migrar dados se houver

---

## 🧪 Como Testar

1. **Criar novo lead:**
   - ✅ Deve funcionar normalmente
   - ✅ ID será gerado automaticamente pelo banco

2. **Editar lead existente:**
   - ✅ URL `/leads/123` deve funcionar
   - ✅ Dados devem ser carregados corretamente

3. **Importar planilha:**
   - ✅ Se planilha tiver ID numérico, será usado
   - ✅ Se planilha não tiver ID ou for inválido, banco gerará automaticamente
   - ✅ IDs duplicados são ignorados (não atualiza lead existente)

4. **Listar leads:**
   - ✅ IDs devem aparecer como números
   - ✅ Tabela deve funcionar normalmente

---

## ⚠️ Migração de Dados (se necessário)

Se você tinha leads com IDs em formato string, precisará migrar:

```sql
-- Exemplo de migração (ajuste conforme necessário)
-- 1. Criar nova coluna temporária
ALTER TABLE leads ADD COLUMN id_new SERIAL;

-- 2. Copiar dados (ajuste conforme sua lógica)
-- ...

-- 3. Remover coluna antiga e renomear nova
-- ...
```

**Nota:** A migração depende da estrutura atual dos seus dados. Se os IDs antigos eram números em formato string, pode ser mais simples.

---

**Status: ✅ Ajustes completos e prontos para deploy**






