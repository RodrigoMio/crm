# ✅ Feature: Ocorrências de Leads

## 📋 Funcionalidade Implementada

Sistema completo de ocorrências para leads, permitindo que usuários registrem e visualizem interações e eventos relacionados a cada lead.

---

## 🎨 Funcionalidades

### Backend

1. ✅ **Entidade Occurrence**
   - Relacionamento com Lead (`leads_id`)
   - Relacionamento com User (`usuarios_id`)
   - Campo `texto` (TEXT, obrigatório)
   - Campo `tipo` (VARCHAR(50), enum: 'SISTEMA' ou 'USUARIO')
   - Campo `created_at` (TIMESTAMPTZ)

2. ✅ **API Endpoints**
   - `GET /leads/:leadId/occurrences` - Lista ocorrências de um lead
   - `POST /leads/:leadId/occurrences` - Cria nova ocorrência
   - `DELETE /leads/:leadId/occurrences/:id` - Remove ocorrência

3. ✅ **Regras de Negócio**
   - Verifica permissão de acesso ao lead antes de listar/criar ocorrências
   - Ocorrências do tipo USUARIO são criadas automaticamente
   - Apenas o próprio usuário pode excluir suas ocorrências do tipo USUARIO
   - Apenas ocorrências criadas há menos de 1 hora podem ser excluídas

### Frontend

1. ✅ **Tela de Leads**
   - Botão "Excluir" substituído por ícone de lixeira
   - Novo ícone CTA (balão de conversa) para abrir modal de ocorrências

2. ✅ **Modal de Ocorrências (Full Screen)**
   - Modal em tela cheia (95% da viewport)
   - Título com nome do lead
   - Formulário para nova ocorrência:
     - Textarea com limite de 255 caracteres
     - Contador de caracteres
     - Validação: não permite salvar sem texto
   - Lista de ocorrências:
     - Ordenada por data decrescente (mais recentes primeiro)
     - Exibe: Data, Ocorrência, Usuário
     - Ícone de lixeira para exclusão (quando permitido)

3. ✅ **Regras de Exclusão no Frontend**
   - Exibe ícone de lixeira apenas se:
     - Tipo = USUARIO
     - Criada pelo próprio usuário logado
     - Criada há menos de 1 hora

---

## 📁 Arquivos Criados

### Backend

- `backend/src/occurrences/entities/occurrence.entity.ts`
- `backend/src/occurrences/dto/create-occurrence.dto.ts`
- `backend/src/occurrences/occurrences.service.ts`
- `backend/src/occurrences/occurrences.controller.ts`
- `backend/src/occurrences/occurrences.module.ts`

### Frontend

- `frontend/src/types/occurrence.ts`
- Estilos adicionados em `frontend/src/pages/LeadsList.css`

### Arquivos Modificados

- `backend/src/app.module.ts` - Adicionado OccurrencesModule
- `backend/src/leads/leads.module.ts` - Exportado LeadsService
- `frontend/src/pages/LeadsList.tsx` - Adicionado modal e ícones

---

## 🔌 Endpoints da API

### GET /leads/:leadId/occurrences

**Descrição**: Lista todas as ocorrências de um lead

**Autenticação**: Requerida (JWT)

**Resposta:**
```json
[
  {
    "id": 1,
    "leads_id": 335,
    "usuarios_id": 5,
    "texto": "Entrei em contato e cliente disse que deseja comprar animais nelore fêmeas até 18 meses",
    "tipo": "USUARIO",
    "created_at": "2025-12-16T17:00:00Z",
    "usuario": {
      "id": 5,
      "nome": "IZA",
      "email": "iza@email.com"
    }
  }
]
```

### POST /leads/:leadId/occurrences

**Descrição**: Cria uma nova ocorrência

**Autenticação**: Requerida (JWT)

**Body:**
```json
{
  "texto": "Nova ocorrência do lead",
  "tipo": "USUARIO"
}
```

**Validações:**
- `texto`: obrigatório, máximo 255 caracteres
- `tipo`: opcional (padrão: "USUARIO")

**Resposta:**
```json
{
  "id": 2,
  "leads_id": 335,
  "usuarios_id": 5,
  "texto": "Nova ocorrência do lead",
  "tipo": "USUARIO",
  "created_at": "2025-12-16T18:00:00Z"
}
```

### DELETE /leads/:leadId/occurrences/:id

**Descrição**: Remove uma ocorrência

**Autenticação**: Requerida (JWT)

**Regras:**
- Apenas ocorrências do tipo USUARIO
- Apenas do próprio usuário
- Apenas se criada há menos de 1 hora

**Resposta:**
```json
{
  "message": "Ocorrência removida com sucesso"
}
```

---

## 🎯 Fluxo de Uso

1. **Visualizar Ocorrências:**
   - Usuário clica no ícone de balão de conversa na linha do lead
   - Modal full screen abre com lista de ocorrências
   - Ocorrências são exibidas em ordem decrescente (mais recentes primeiro)

2. **Criar Nova Ocorrência:**
   - Usuário preenche o campo de texto (máx 255 caracteres)
   - Clica em "Salvar"
   - Ocorrência é criada automaticamente com tipo "USUARIO"
   - Lista é atualizada automaticamente

3. **Excluir Ocorrência:**
   - Usuário vê ícone de lixeira apenas em suas próprias ocorrências (tipo USUARIO) criadas há menos de 1 hora
   - Clica no ícone e confirma
   - Ocorrência é removida

---

## 🔐 Segurança e Permissões

- ✅ Verifica permissão de acesso ao lead antes de listar/criar ocorrências
- ✅ Apenas o próprio usuário pode excluir suas ocorrências
- ✅ Apenas ocorrências recentes (< 1 hora) podem ser excluídas
- ✅ Ocorrências do tipo SISTEMA não podem ser excluídas

---

## 📝 Notas Técnicas

1. **Ordenação**: Ocorrências são ordenadas por `created_at DESC` (mais recentes primeiro)

2. **Validação de Tempo**: 
   - Backend valida se a ocorrência foi criada há menos de 1 hora
   - Frontend também valida para exibir/ocultar ícone de exclusão

3. **Limite de Caracteres**: 
   - Frontend limita input a 255 caracteres
   - Backend valida com `@MaxLength(255)`

4. **Modal Full Screen**: 
   - Ocupa 95% da viewport
   - Responsivo e com scroll interno
   - Header fixo com botão de fechar

---

## ✅ Checklist de Validação

- [x] Entidade Occurrence criada
- [x] DTOs criados
- [x] Service implementado
- [x] Controller implementado
- [x] Módulo criado e registrado
- [x] Tipos TypeScript criados
- [x] Ícone de lixeira no lugar do botão "Excluir"
- [x] Ícone CTA para abrir modal
- [x] Modal full screen implementado
- [x] Lista de ocorrências ordenada por data
- [x] Formulário de nova ocorrência
- [x] Validação de 255 caracteres
- [x] Validação de texto obrigatório
- [x] Exclusão condicional (tipo, usuário, tempo)
- [x] Estilos CSS aplicados

---

**Status: ✅ Implementação completa e pronta para uso**






