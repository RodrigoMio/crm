# 📋 Instruções de Implementação - Feature Colaboradores

## ✅ Implementação Completa

A feature de Colaboradores foi implementada com sucesso! Este documento contém todas as instruções necessárias para aplicar as mudanças.

---

## 🗄️ Banco de Dados

### Migration SQL

Execute a migration `003-add-colaboradores.sql` no banco de dados PostgreSQL:

```bash
psql -U seu_usuario -d seu_banco -f backend/src/migrations/003-add-colaboradores.sql
```

**Ou via painel do PostgreSQL:**
1. Acesse o painel do PostgreSQL (Redehost)
2. Execute o conteúdo do arquivo `backend/src/migrations/003-add-colaboradores.sql`

**O que a migration faz:**
- ✅ Adiciona perfil `COLABORADOR` na tabela `usuarios`
- ✅ Adiciona campo `usuario_id_pai` na tabela `usuarios` (FK para usuarios.id)
- ✅ Adiciona campo `usuario_id_colaborador` na tabela `leads` (FK para usuarios.id)
- ✅ Cria índices para melhor performance
- ✅ Adiciona foreign keys com constraints apropriadas

---

## 🔧 Backend

### Arquivos Modificados

1. **Entidades:**
   - `backend/src/users/entities/user.entity.ts` - Adicionado perfil COLABORADOR e campo usuario_id_pai
   - `backend/src/leads/entities/lead.entity.ts` - Adicionado campo usuario_id_colaborador

2. **DTOs:**
   - `backend/src/users/dto/create-user.dto.ts` - Adicionado campo usuario_id_pai
   - `backend/src/users/dto/update-user.dto.ts` - Adicionado campo usuario_id_pai
   - `backend/src/leads/dto/create-lead.dto.ts` - Adicionado campo usuario_id_colaborador
   - `backend/src/leads/dto/update-lead.dto.ts` - Adicionado campo usuario_id_colaborador
   - `backend/src/leads/dto/filter-leads.dto.ts` - Adicionado filtro usuario_id_colaborador

3. **Services:**
   - `backend/src/users/users.service.ts` - Lógica de criação de colaboradores e validações
   - `backend/src/leads/leads.service.ts` - Novas regras de visibilidade e permissões

4. **Controllers:**
   - `backend/src/users/users.controller.ts` - Novo endpoint `/users/colaboradores`
   - `backend/src/leads/leads.controller.ts` - Permissões atualizadas

### Novos Endpoints

**GET /users/colaboradores**
- Lista colaboradores
- Agente vê apenas seus colaboradores
- Admin pode filtrar por `agente_id` (query param)

**Exemplo:**
```bash
# Agente vê seus colaboradores
GET /users/colaboradores

# Admin filtra por agente
GET /users/colaboradores?agente_id=5
```

---

## 🎨 Frontend

### Arquivos Modificados

1. **Tipos TypeScript:**
   - `frontend/src/types/user.ts` - Adicionado perfil COLABORADOR e campos relacionados
   - `frontend/src/types/lead.ts` - Adicionado campo usuario_id_colaborador

2. **Context:**
   - `frontend/src/contexts/AuthContext.tsx` - Atualizado tipo User para incluir COLABORADOR

3. **Páginas:**
   - `frontend/src/pages/UsersList.tsx` - Formulário de criação/edição com suporte a colaboradores
   - `frontend/src/pages/LeadsList.tsx` - Coluna Colaborador, filtros e edição

### Funcionalidades Frontend

#### 1. Criação de Usuários

**Admin:**
- Pode criar ADMIN, AGENTE e COLABORADOR
- Ao criar COLABORADOR, deve selecionar o Agente pai

**Agente:**
- Pode criar apenas COLABORADOR
- Campo perfil já vem selecionado como COLABORADOR
- Campo usuario_id_pai já vem preenchido (oculto) com o ID do Agente

#### 2. Listagem de Leads

**Admin:**
- Vê coluna "Vendedor"
- Filtro por Vendedor

**Agente:**
- Vê coluna "Colaborador"
- Filtro por Colaborador (apenas seus colaboradores)
- Vê seus próprios leads E leads de seus colaboradores

**Colaborador:**
- Vê coluna "Vendedor"
- Vê apenas leads atribuídos a ele (usuario_id_colaborador = seu id)

#### 3. Edição de Leads

**Admin:**
- Pode alterar `vendedor_id` (selecionar qualquer Agente)
- Pode alterar `usuario_id_colaborador` (selecionar qualquer Colaborador)

**Agente:**
- NÃO pode alterar `vendedor_id` (desabilitado)
- Pode alterar apenas `usuario_id_colaborador` (apenas seus colaboradores)

**Colaborador:**
- NÃO pode editar leads (apenas visualizar)

---

## 🔐 Regras de Visibilidade e Permissões

### Visibilidade de Leads

| Perfil | O que vê |
|--------|----------|
| **ADMIN** | Todos os leads |
| **AGENTE** | Leads onde `vendedor_id = agente.id` OU `usuario_id_colaborador` pertence aos seus colaboradores |
| **COLABORADOR** | Leads onde `usuario_id_colaborador = colaborador.id` |

### Permissões de Criação

| Perfil | Pode criar |
|--------|------------|
| **ADMIN** | ADMIN, AGENTE, COLABORADOR |
| **AGENTE** | COLABORADOR (vinculado a ele) |
| **COLABORADOR** | Nada |

### Permissões de Edição de Leads

| Perfil | Pode editar |
|--------|-------------|
| **ADMIN** | Qualquer lead (pode alterar vendedor_id e usuario_id_colaborador) |
| **AGENTE** | Seus próprios leads (pode alterar apenas usuario_id_colaborador) |
| **COLABORADOR** | Nada (apenas visualizar) |

---

## 🚀 Deploy

### Passo 1: Executar Migration

```bash
# Via SSH no servidor
ssh crmcc@nodejsnglf02
cd /home/crmcc/apps_nodejs/crm/
psql -U seu_usuario -d seu_banco -f src/migrations/003-add-colaboradores.sql
```

### Passo 2: Build Backend

```bash
cd backend
npm run build
```

### Passo 3: Upload Backend

Faça upload dos arquivos compilados de `backend/dist/` para `/home/crmcc/apps_nodejs/crm/dist/`

### Passo 4: Build Frontend

```bash
cd frontend
npm run build
```

### Passo 5: Upload Frontend

Faça upload dos arquivos de `frontend/dist/` para `/home/crmcc/www/`

### Passo 6: Reiniciar Aplicação

No painel da KingHost, reinicie a aplicação Node.js.

---

## ✅ Checklist de Validação

Após o deploy, valide:

- [ ] Migration executada com sucesso
- [ ] Admin pode criar COLABORADOR com Agente pai
- [ ] Agente pode criar COLABORADOR (vinculado a ele)
- [ ] Admin vê todos os leads
- [ ] Agente vê seus leads e leads de seus colaboradores
- [ ] Colaborador vê apenas leads atribuídos a ele
- [ ] Filtro por Colaborador funciona para Agente
- [ ] Coluna Colaborador aparece na listagem para Agente
- [ ] Admin pode alterar vendedor_id e usuario_id_colaborador
- [ ] Agente pode alterar apenas usuario_id_colaborador
- [ ] Colaborador não pode editar leads

---

## 📝 Notas Importantes

1. **IDs são INT**: As tabelas em produção usam IDs do tipo INT (não UUID), então todos os campos de relacionamento também são INT.

2. **Colaborador não pode criar leads**: Colaboradores têm apenas permissão de visualização.

3. **Validações**: O backend valida que:
   - Colaborador deve ter um Agente pai
   - Agente só pode criar colaboradores para si mesmo
   - Agente só pode atribuir leads a seus próprios colaboradores

4. **Performance**: Índices foram criados para otimizar as consultas com os novos campos.

---

## 🐛 Troubleshooting

### Erro: "Colaborador deve ter um Agente pai"
- Verifique se `usuario_id_pai` está sendo enviado ao criar COLABORADOR
- Para Agente, o campo é preenchido automaticamente

### Erro: "Agente só pode atribuir leads a seus próprios colaboradores"
- Verifique se o colaborador selecionado pertence ao Agente logado
- Use o endpoint `/users/colaboradores` para listar apenas colaboradores do Agente

### Leads não aparecem para Colaborador
- Verifique se o lead tem `usuario_id_colaborador` preenchido
- Verifique se o `usuario_id_colaborador` corresponde ao ID do colaborador logado

---

## 📞 Suporte

Em caso de dúvidas ou problemas, verifique:
1. Logs do backend (painel KingHost)
2. Console do navegador (F12)
3. Network tab (F12 → Network) para ver requisições






