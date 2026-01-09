# Exemplos de Uso da API

Este documento contém exemplos de requisições para a API do CRM.

## Autenticação

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@crm.com",
  "senha": "admin123"
}
```

**Resposta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "nome": "Administrador",
    "email": "admin@crm.com",
    "perfil": "ADMIN"
  }
}
```

**Uso do token:**
Todas as requisições autenticadas devem incluir o header:
```
Authorization: Bearer {access_token}
```

## Usuários (Admin apenas)

### Listar todos os usuários

```bash
GET /api/users
Authorization: Bearer {token}
```

### Listar agentes (público autenticado)

```bash
GET /api/users/agentes
Authorization: Bearer {token}
```

### Criar usuário

```bash
POST /api/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "nome": "Novo Agente",
  "email": "agente@crm.com",
  "senha": "senha123",
  "perfil": "AGENTE",
  "ativo": true
}
```

### Atualizar usuário

```bash
PATCH /api/users/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "nome": "Nome Atualizado",
  "ativo": false
}
```

### Desativar usuário

```bash
DELETE /api/users/{id}
Authorization: Bearer {token}
```

## Leads

### Listar leads (com filtros)

```bash
GET /api/leads?nome_razao_social=Fazenda&status=TEM_INTERESSE&origem_lead=CAMPANHA_MKT&vendedor_id={uuid}
Authorization: Bearer {token}
```

**Parâmetros de query:**
- `nome_razao_social` (opcional): Busca parcial por nome
- `status` (opcional, múltiplos): Array de status (ex: `status=TEM_INTERESSE&status=LEAD_QUENTE`)
- `origem_lead` (opcional): Origem única
- `vendedor_id` (opcional): ID do vendedor (apenas Admin pode filtrar por outro vendedor)

**Resposta:**
```json
[
  {
    "id": "uuid",
    "data_entrada": "2024-01-15",
    "nome_razao_social": "Fazenda São João",
    "nome_fantasia_apelido": "Fazenda SJ",
    "telefone": "(11) 98765-4321",
    "email": "contato@fazendasa joao.com",
    "uf": "SP",
    "municipio": "Campinas",
    "anotacoes": "Cliente interessado em Nelore",
    "origem_lead": "CAMPANHA_MKT",
    "total_conversoes": 5,
    "vendedor_id": "uuid",
    "vendedor": {
      "id": "uuid",
      "nome": "João Silva",
      "email": "joao@crm.com"
    },
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
]
```

### Buscar lead por ID

```bash
GET /api/leads/{id}
Authorization: Bearer {token}
```

### Criar lead

```bash
POST /api/leads
Authorization: Bearer {token}
Content-Type: application/json

{
  "data_entrada": "2024-02-15",
  "nome_razao_social": "Fazenda Nova",
  "nome_fantasia_apelido": "Fazenda Nova",
  "telefone": "(11) 99999-8888",
  "email": "contato@fazendanova.com",
  "uf": "SP",
  "municipio": "São Paulo",
  "anotacoes": "Cliente potencial",
  "origem_lead": "WHATSAPP",
  "total_conversoes": 2,
  "vendedor_id": "uuid-do-vendedor"
}
```

**Regras:**
- Admin pode criar lead para qualquer vendedor
- Agente só pode criar lead para si mesmo (vendedor_id deve ser o próprio ID)

### Atualizar lead

```bash
PATCH /api/leads/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "anotacoes": "Atualização das anotações"
}
```

**Regras:**
- Admin pode atualizar qualquer lead
- Agente só pode atualizar seus próprios leads
- Agente não pode transferir lead para outro vendedor

### Remover lead

```bash
DELETE /api/leads/{id}
Authorization: Bearer {token}
```

**Regras:**
- Admin pode remover qualquer lead
- Agente só pode remover seus próprios leads

## Enums

### LeadStatus
- `NAO_ATENDEU`
- `NAO_E_MOMENTO`
- `TEM_INTERESSE`
- `NAO_TEM_INTERESSE`
- `TELEFONE_INVALIDO`
- `LEAD_QUENTE`
- `RETORNO_AGENDADO`
- `NAO_E_PECUARISTA`
- `AGUARDANDO_OFERTAS`

### OrigemLead
- `CAMPANHA_MKT`
- `HABILITADOS`
- `BASE_RD`
- `NETWORKING`
- `WHATSAPP`
- `AGENTE_VENDAS`
- `BASE_CANAL_DO_CAMPO`

## Códigos de Erro

- `401 Unauthorized`: Token inválido ou ausente
- `403 Forbidden`: Usuário não tem permissão (ex: Agente tentando ver lead de outro)
- `404 Not Found`: Recurso não encontrado
- `409 Conflict`: Conflito (ex: email já cadastrado)
- `400 Bad Request`: Dados inválidos












