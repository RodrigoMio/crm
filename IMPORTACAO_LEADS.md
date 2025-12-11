# Importação de Leads via Planilha

## 📋 Funcionalidade

O sistema permite importar múltiplos leads de uma vez através de arquivos Excel (.xlsx, .xls) ou CSV.

**⚠️ IMPORTANTE:** O sistema processa **APENAS a primeira aba/guia** da planilha Excel. Se o arquivo tiver múltiplas abas, apenas a primeira será processada e as demais serão ignoradas.

## 📤 Como Usar

### 1. Preparar a Planilha

A planilha deve conter as seguintes colunas na ordem especificada:

#### Estrutura da Planilha:

| Coluna A | Data | LEAD | Telefone | Email | UF | Município | Raça | Descrição do produto | Situacao | Vendedor | Origem do Lead |
|----------|------|-----|----------|-------|----|-----------|------|---------------------|----------|----------|----------------|
| ID (UUID) | Data | Nome/Razão Social | Telefone | Email | Estado | Município/Cidade | Raça | Descrição | Status | Nome do Vendedor | Origem |

#### Campos Obrigatórios:
- **ID** (Coluna A - primeira coluna): UUID do lead (obrigatório)
- **LEAD**: Nome/Razão Social (obrigatório)

**⚠️ IMPORTANTE:**
- Se o ID não estiver preenchido, a linha será ignorada
- Se o ID já existir no banco, a linha será ignorada (não atualiza leads existentes)

#### Campos Opcionais:
- **Data**: Data de entrada do lead
- **Telefone**: Telefone do lead
- **Email**: Email do lead
- **UF**: Estado (Unidade Federativa) do lead
- **Município**: Município/Cidade do lead
- **Raça**: Raça/Item de interesse (será adicionado aos itens_interesse)
- **Descrição do produto**: Anotações do lead
- **Situacao**: Status do lead (será adicionado ao status)
- **Vendedor**: Nome do vendedor/agente (o sistema busca pelo nome)
- **Origem do Lead**: Origem do lead

### 2. Mapeamento de Colunas

| Coluna na Planilha | Campo no Sistema | Tipo | Observações |
|-------------------|------------------|------|-------------|
| ID (Coluna A) | id | UUID | Obrigatório - Primeira coluna |
| Data | data_entrada | Date | Opcional |
| LEAD | nome_razao_social | String | Obrigatório |
| Telefone | telefone | String | Opcional |
| Email | email | String | Opcional |
| UF | uf | String | Opcional - Máximo 2 caracteres (convertido para maiúsculas) |
| Município | municipio | String | Opcional |
| Raça | itens_interesse | Array | Adiciona ao array de itens de interesse |
| Descrição do produto | anotacoes | String | Opcional |
| Situacao | status | Array | Adiciona ao array de status |
| Vendedor | vendedor_id | UUID | Busca vendedor pelo nome |
| Origem do Lead | origem_lead | Enum | Opcional |

### 3. Valores Aceitos

#### Status (campo "Situacao"):
- NAO_ATENDEU
- NAO_E_MOMENTO
- TEM_INTERESSE
- NAO_TEM_INTERESSE
- TELEFONE_INVALIDO
- LEAD_QUENTE
- RETORNO_AGENDADO
- NAO_E_PECUARISTA
- AGUARDANDO_OFERTAS

#### Itens de Interesse (campo "Raça"):
- GIR
- GUZERA
- INDUBRASIL
- SINDI
- NELORE
- NELORE_MOCHO
- TABAPUA
- BRAHMAN
- ANGUS
- GIROLANDO
- NELORE_PINTADO
- HOLANDES
- BRANGUS

#### Origem Lead (single select):
- CAMPANHA_MKT
- HABILITADOS
- BASE_RD
- NETWORKING
- WHATSAPP
- AGENTE_VENDAS
- BASE_CANAL_DO_CAMPO

### 4. Exemplo de Planilha

| ID | Data | LEAD | Telefone | Email | UF | Município | Raça | Descrição do produto | Situacao | Vendedor | Origem do Lead |
|----|------|------|----------|-------|----|-----------|------|---------------------|----------|----------|----------------|
| 550e8400-e29b-41d4-a716-446655440000 | 2024-01-15 | Fazenda São João | (11) 98765-4321 | fazenda@email.com | SP | São Paulo | NELORE | Cliente interessado em Nelore | TEM_INTERESSE | João Silva | CAMPANHA_MKT |
| 660e8400-e29b-41d4-a716-446655440001 | 2024-01-20 | Pecuária do Sul | (51) 99876-5432 | pecuaria@email.com | RS | Porto Alegre | ANGUS | Aguardando retorno | RETORNO_AGENDADO | Maria Santos | NETWORKING |

### 5. Regras de Validação

- **ID obrigatório**: Se o ID não estiver preenchido, a linha será ignorada
- **ID único**: Se o ID já existir no banco, a linha será ignorada (não atualiza leads existentes)
- **LEAD obrigatório**: Se o campo LEAD não estiver preenchido, a linha será ignorada
- **Vendedor**: O sistema busca o vendedor pelo nome. Se não encontrar ou houver múltiplos com o mesmo nome, a linha terá erro
- **Raça**: Adiciona ao array de itens_interesse (não substitui, adiciona)
- **Situacao**: Adiciona ao array de status (não substitui, adiciona)

### 6. Fazer Upload

**Endpoint:** `POST /api/leads/import`

**Headers:**
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

**Body:**
- Campo: `file`
- Tipo: Arquivo Excel (.xlsx, .xls) ou CSV (.csv)
- Tamanho máximo: 50MB

**Exemplo usando cURL:**
```bash
curl -X POST http://localhost:3001/api/leads/import \
  -H "Authorization: Bearer {seu_token}" \
  -F "file=@planilha.xlsx"
```

**Exemplo usando JavaScript/Fetch:**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:3001/api/leads/import', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result);
```

### 7. Resposta

A API retorna um objeto com:
- `success`: Número de leads importados com sucesso
- `skipped`: Número de linhas ignoradas (ID já existe ou não preenchido)
- `errors`: Array de erros encontrados (se houver)

**Exemplo de resposta:**
```json
{
  "success": 8,
  "skipped": 2,
  "errors": [
    {
      "linha": 3,
      "erro": "Vendedor 'João' não encontrado"
    },
    {
      "linha": 5,
      "erro": "ID 'abc123' não é um UUID válido"
    }
  ]
}
```

## 🔐 Regras de Negócio

- **Admin**: Pode importar leads para qualquer vendedor
- **Agente**: Só pode importar leads para si mesmo (o campo "Vendedor ID" será ignorado e substituído pelo ID do agente)

## ⚠️ Observações

1. O sistema aceita múltiplos nomes de coluna (ex: "Nome", "Nome/Razão Social", "Razão Social")
2. Valores de enum podem ser escritos com ou sem underscore (ex: "TEM_INTERESSE" ou "TEM INTERESSE")
3. Arrays (Status e Itens Interesse) podem ser separados por vírgula, ponto e vírgula ou pipe
4. Datas podem estar em vários formatos (o sistema tenta converter automaticamente)
5. O arquivo é processado e depois removido automaticamente

## 🐛 Tratamento de Erros

- Se uma linha tiver erro, ela é ignorada e o erro é reportado
- As outras linhas continuam sendo processadas
- O sistema valida todos os campos antes de inserir no banco

