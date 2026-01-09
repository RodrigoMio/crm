# Importação de Leads via Planilha

## 📋 Funcionalidade

O sistema permite importar múltiplos leads de uma vez através de arquivos Excel (.xlsx, .xls) ou CSV.

**⚠️ IMPORTANTE:** O sistema processa **APENAS a primeira aba/guia** da planilha Excel. Se o arquivo tiver múltiplas abas, apenas a primeira será processada e as demais serão ignoradas.

## 📤 Como Usar

### 1. Preparar a Planilha

A planilha deve conter as seguintes colunas na ordem especificada:

#### Estrutura da Planilha:

| Coluna A | Data | LEAD | Telefone | Email | UF | Município | APELIDO | Descrição do produto | OCORRENCIA | TAGS | Vendedor | Origem do Lead | Total Conversões |
|----------|------|-----|----------|-------|----|-----------|---------|---------------------|------------|------|----------|----------------|------------------|
| ID | Data | Nome/Razão Social | Telefone | Email | Estado | Município/Cidade | Apelido/Nome Fantasia | Descrição | Ocorrências | Tags | Nome do Vendedor | Origem | Total Conversões |

#### Campos Obrigatórios na Estrutura da Planilha:
A planilha **DEVE** conter as seguintes colunas na primeira linha (cabeçalho):
- **ID** (Coluna A - primeira coluna): Número do lead (obrigatório)
- **Nome ou LEAD**: Nome/Razão Social (obrigatório)
- **Email**: Email do lead (obrigatório)
- **Telefone**: Telefone do lead (obrigatório)
- **Origem do Lead**: Origem do lead (obrigatório)

**⚠️ IMPORTANTE:**
- Se alguma das colunas obrigatórias estiver faltando, a importação será bloqueada e um modal de erro será exibido
- Se o ID não estiver preenchido, a linha será ignorada
- Se o ID já existir no banco, a linha será ignorada (não atualiza leads existentes)
- **Origem do Lead é OBRIGATÓRIO**: Se uma linha não tiver "Origem do Lead" preenchido, essa linha será ignorada durante a importação

#### Campos Opcionais:
- **Data**: Data de entrada do lead
- **UF**: Estado (Unidade Federativa) do lead
- **Município**: Município/Cidade do lead
- **APELIDO**: Nome fantasia ou apelido do lead
- **Descrição do produto**: Anotações do lead
- **OCORRENCIA**: Ocorrências do lead (formato especial - ver detalhes abaixo)
- **TAGS**: Tags do lead (formato especial - ver detalhes abaixo)
- **Vendedor**: Nome do vendedor/agente (o sistema busca pelo nome). **Opcional** - se deixado vazio, o campo `vendedor_id` ficará como NULL
- **Total Conversões**: Número inteiro representando o total de conversões. **Opcional**

**⚠️ ATENÇÃO - Origem do Lead:**
- A coluna "Origem do Lead" é **OBRIGATÓRIA** na estrutura da planilha (deve existir no cabeçalho)
- Se uma linha não tiver o campo "Origem do Lead" preenchido, essa linha será **ignorada** durante a importação

### 2. Mapeamento de Colunas

| Coluna na Planilha | Campo no Sistema | Tipo | Observações |
|-------------------|------------------|------|-------------|
| ID (Coluna A) | id | Integer | Obrigatório - Primeira coluna |
| Data | data_entrada | Date | Opcional |
| LEAD | nome_razao_social | String | Obrigatório |
| Telefone | telefone | String | Obrigatório na estrutura (coluna deve existir) |
| Email | email | String | Obrigatório na estrutura (coluna deve existir) |
| UF | uf | String | Opcional - Máximo 2 caracteres (convertido para maiúsculas) |
| Município | municipio | String | Opcional |
| APELIDO | nome_fantasia_apelido | String | Opcional |
| Descrição do produto | anotacoes | String | Opcional |
| OCORRENCIA | - | String | Opcional - Processamento complexo (ver detalhes) |
| TAGS | - | String | Opcional - Processamento complexo (ver detalhes) |
| Vendedor | vendedor_id | Integer | Opcional - Busca vendedor pelo nome. Se vazio, vendedor_id será NULL |
| Origem do Lead | origem_lead | Enum | Obrigatório na estrutura E obrigatório em cada linha (linhas sem origem serão ignoradas) |
| Total Conversões | total_conversoes | Integer | Opcional - Número inteiro |

### 3. Valores Aceitos

#### Origem Lead (single select):
- CAMPANHA_MKT
- HABILITADOS
- BASE_RD
- NETWORKING
- WHATSAPP
- AGENTE_VENDAS
- BASE_CANAL_DO_CAMPO

### 4. Exemplo de Planilha

| ID | Data | LEAD | Telefone | Email | UF | Município | Descrição do produto | Vendedor | Origem do Lead | Total Conversões |
|----|------|------|----------|-------|----|-----------|---------------------|----------|----------------|------------------|
| 550e8400-e29b-41d4-a716-446655440000 | 2024-01-15 | Fazenda São João | (11) 98765-4321 | fazenda@email.com | SP | São Paulo | Cliente interessado em Nelore | João Silva | CAMPANHA_MKT | 5 |
| 660e8400-e29b-41d4-a716-446655440001 | 2024-01-20 | Pecuária do Sul | (51) 99876-5432 | pecuaria@email.com | RS | Porto Alegre | Aguardando retorno | Maria Santos | NETWORKING | 2 |

### 8. Regras de Validação

- **Estrutura obrigatória**: A planilha DEVE conter as seguintes colunas no cabeçalho (primeira linha): **ID**, **Nome ou LEAD**, **Email**, **Telefone**, **Origem do Lead**. Se alguma coluna estiver faltando, a importação será bloqueada e um modal de erro será exibido com instruções
- **ID obrigatório**: Se o ID não estiver preenchido, a linha será ignorada
- **ID único**: Se o ID já existir no banco, a linha será ignorada (não atualiza leads existentes)
- **LEAD obrigatório**: Se o campo LEAD não estiver preenchido, a linha será ignorada
- **Email obrigatório na estrutura**: A coluna Email deve existir no cabeçalho (mesmo que vazia em algumas linhas)
- **Telefone obrigatório na estrutura**: A coluna Telefone deve existir no cabeçalho (mesmo que vazio em algumas linhas)
- **Origem do Lead obrigatório**: A coluna "Origem do Lead" deve existir no cabeçalho E deve estar preenchida em cada linha. Linhas sem "Origem do Lead" serão ignoradas durante a importação
- **Vendedor**: Opcional - O sistema busca o vendedor pelo nome. Se não encontrar ou houver múltiplos com o mesmo nome, a importação será interrompida. Se deixado vazio, o campo `vendedor_id` ficará como NULL
- **OCORRENCIA vazia**: Se a coluna OCORRENCIA estiver vazia, será ignorada silenciosamente
- **TAGS vazia**: Se a coluna TAGS estiver vazia, será ignorada silenciosamente
- **Transações**: Se ocorrer erro ao processar OCORRENCIA ou TAGS, todo o lead será revertido (rollback) e a importação será interrompida

### 9. Fazer Upload

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

### 10. Resposta

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

- **Admin**: Pode importar leads para qualquer vendedor ou deixar vazio (vendedor_id será NULL)
- **Agente**: Só pode importar leads para si mesmo (o campo "Vendedor" será ignorado e substituído pelo ID do agente)

## ⚠️ Observações

1. O sistema aceita múltiplos nomes de coluna (ex: "Nome", "Nome/Razão Social", "Razão Social")
2. Valores de enum podem ser escritos com ou sem underscore (ex: "CAMPANHA_MKT" ou "CAMPANHA MKT")
3. Datas podem estar em vários formatos (o sistema tenta converter automaticamente)
5. O arquivo é processado e depois removido automaticamente
6. **OCORRENCIA e TAGS**: Valores vazios são ignorados silenciosamente
7. **Produtos e Ocorrências**: Busca case-insensitive (maiúsculas e minúsculas são tratadas como iguais)
8. **Transações**: Cada lead é processado em uma transação. Se houver erro, todo o lead (incluindo ocorrências e tags) é revertido

## 🐛 Tratamento de Erros

- Se uma linha tiver erro, a importação é interrompida e o erro é reportado
- As linhas anteriores já foram importadas com sucesso
- Se houver erro ao processar OCORRENCIA ou TAGS, todo o lead é revertido (rollback)
- O sistema valida todos os campos antes de inserir no banco

