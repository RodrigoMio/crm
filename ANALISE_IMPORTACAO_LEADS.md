# 📋 Análise Detalhada: Ajustes na Importação de Planilha

## 🎯 Objetivo
Ajustar o processo de importação de planilha para trabalhar com as novas tabelas criadas no banco de dados:
- `produto`
- `leads_produto`
- `ocorrencia`
- `lead_ocorrencia`

---

## 📊 Estrutura Atual vs Nova

### Estrutura Atual da Importação

**Arquivos Principais:**
- `backend/src/leads/leads-import.service.ts` - Processa Excel/CSV e mapeia colunas
- `backend/src/leads/leads.service.ts` - Método `importLeads()` que salva no banco
- `backend/src/leads/dto/import-lead.dto.ts` - DTO de validação

**Colunas Atuais Processadas:**
- ID (Coluna A) → `leads.id`
- Data → `leads.data_entrada`
- LEAD → `leads.nome_razao_social`
- Telefone → `leads.telefone`
- Email → `leads.email`
- UF → `leads.uf`
- Município → `leads.municipio`
- Descrição do produto → `leads.anotacoes`
- Situacao → `leads.status[]` (array) - **SERÁ REMOVIDO**
- Vendedor → `leads.vendedor_id` (busca por nome)
- Origem do Lead → `leads.origem_lead`

---

## 🔄 Mudanças Necessárias

### 1. Colunas a MANTER (sem alteração)
- ✅ NOME → `leads.nome_razao_social`
- ✅ TELEFONE → `leads.telefone`
- ✅ EMAIL → `leads.email`
- ✅ UF → `leads.uf`
- ✅ MUNICIPIO → `leads.municipio`
- ✅ ANOTACOES → `leads.anotacoes`

### 2. Colunas a REMOVER
- ❌ **SITUACAO** → Remover completamente do código de importação

### 3. Nova Coluna: APELIDO
- ➕ **APELIDO** → `leads.nome_fantasia_apelido`
- Campo já existe na entidade `Lead` (linha 63-64)
- Apenas adicionar mapeamento no `leads-import.service.ts`

### 4. Nova Coluna: OCORRENCIA (Complexa)
- ➕ **OCORRENCIA** → Processamento complexo que gera registros em múltiplas tabelas

**Formato do Campo:**
```
2025-07-24#COMPRA:GIR LEITEIRO,Fêmea(s)|2024-04-27#COMPRA:NÃO INFORMADA,Máquinas e Equipamentos|2025-08-30#COMPRA:GIROLANDO,Fêmea(s)|
```

**Processamento:**
1. Split por `|` → Array de ocorrências
2. Para cada ocorrência:
   - Split por `#` → `[data, resto]`
   - Split do resto por `:` → `[descricao_ocorrencia, produtos]`
   - Split de produtos por `,` → Array de produtos

**Exemplo de Parsing:**
```
Input: "2025-07-24#COMPRA:GIR LEITEIRO,Fêmea(s)|2024-04-27#COMPRA:NÃO INFORMADA,Máquinas e Equipamentos"

Split por "|":
[0] "2025-07-24#COMPRA:GIR LEITEIRO,Fêmea(s)"
[1] "2024-04-27#COMPRA:NÃO INFORMADA,Máquinas e Equipamentos"

Para [0]:
  Split por "#":
    [0] "2025-07-24"
    [1] "COMPRA:GIR LEITEIRO,Fêmea(s)"
  
  Split [1] por ":":
    [0] "COMPRA" → descricao_ocorrencia
    [1] "GIR LEITEIRO,Fêmea(s)" → produtos
  
  Split produtos por ",":
    [0] "GIR LEITEIRO"
    [1] "Fêmea(s)"
```

**Ações no Banco:**
Para cada ocorrência processada:
1. **Tabela `produto`**: 
   - Verificar se existe por `descricao` (ex: "GIR LEITEIRO", "Fêmea(s)")
   - Se não existir, inserir
   - Obter `produto_id`

2. **Tabela `ocorrencia`**:
   - Verificar se existe por `descricao` (ex: "COMPRA")
   - Se não existir, inserir
   - Obter `ocorrencia_id`

3. **Tabela `lead_ocorrencia`**:
   - Inserir registro:
     - `leads_id`: ID do lead sendo importado
     - `ocorrencia_id`: ID da ocorrência encontrada/criada
     - `produto_id`: ID do produto encontrado/criado
     - `data`: Data da ocorrência (ex: "2025-07-24")
     - `active`: `true`
     - `created_at`: Timestamp atual

4. **Tabela `leads_produto`**:
   - Para cada produto encontrado na ocorrência:
     - Verificar se já existe relacionamento `(leads_id, produto_id)`
     - Se não existir, inserir

### 5. Nova Coluna: TAGS
- ➕ **TAGS** → Processamento que gera registros em `produto` e `leads_produto`

**Formato do Campo:**
```
[GIR LEITEIRO][Fêmea(s)][Máquinas e Equipamentos]
```

**Processamento:**
1. Extrair valores entre `[]` usando regex: `/\[([^\]]+)\]/g`
2. Para cada tag encontrada:
   - Verificar se existe em `produto` por `descricao`
   - Se não existir, inserir
   - Verificar se existe relacionamento em `leads_produto` por `(leads_id, produto_id)`
   - Se não existir, inserir

---

## ❓ Dúvidas e Pontos a Esclarecer

### 1. Estrutura de Entidades TypeORM
**Dúvida:** As novas tabelas (`produto`, `ocorrencia`, `lead_ocorrencia`, `leads_produto`) já possuem entidades TypeORM criadas?

**Impacto:** Se não existirem, será necessário criar:
- `backend/src/produtos/entities/produto.entity.ts`
- `backend/src/ocorrencias/entities/ocorrencia.entity.ts` (diferente da `occurrence.entity.ts` existente)
- `backend/src/lead-ocorrencias/entities/lead-ocorrencia.entity.ts`
- `backend/src/leads-produtos/entities/leads-produto.entity.ts`

**Ação Necessária:** Verificar se as entidades existem ou se precisam ser criadas.

---

### 2. Processamento de Produtos na Coluna OCORRENCIA
**Dúvida:** No exemplo fornecido, após o split por `:`, temos:
```
"GIR LEITEIRO,Fêmea(s)"
```

Ao fazer split por `,`, teremos:
- `[0]` = "GIR LEITEIRO"
- `[1]` = "Fêmea(s)"

**Pergunta:** Cada produto separado por vírgula deve gerar:
- A) Uma única entrada em `lead_ocorrencia` com múltiplos produtos? (não possível pela estrutura)
- B) Múltiplas entradas em `lead_ocorrencia`, uma para cada produto?
- C) Uma entrada em `lead_ocorrencia` e múltiplas entradas em `leads_produto`?

**Análise da Estrutura:**
A tabela `lead_ocorrencia` tem:
- `lead_ocorrencia_id` (PK)
- `leads_id` (FK)
- `ocorrencia_id` (FK)
- `produto_id` (FK) - **UM produto por ocorrência**
- `data`
- `active`
- `created_at`

**Conclusão:** Parece que cada combinação `(leads_id, ocorrencia_id, produto_id, data)` deve gerar uma entrada separada em `lead_ocorrencia`.

**Exemplo:**
```
Ocorrência: "2025-07-24#COMPRA:GIR LEITEIRO,Fêmea(s)"
```
Deve gerar:
- 1 entrada em `ocorrencia` (descricao: "COMPRA")
- 2 entradas em `produto` (descricao: "GIR LEITEIRO" e "Fêmea(s)")
- 2 entradas em `lead_ocorrencia`:
  - `(leads_id, ocorrencia_id, produto_id="GIR LEITEIRO", data="2025-07-24")`
  - `(leads_id, ocorrencia_id, produto_id="Fêmea(s)", data="2025-07-24")`
- 2 entradas em `leads_produto` (se não existirem)

**Confirmação Necessária:** Esta interpretação está correta?

---

### 3. Tratamento de Valores Vazios/Nulos
**Dúvidas:**
- Se a coluna OCORRENCIA estiver vazia, devemos ignorar ou gerar erro?
- Se a coluna TAGS estiver vazia, devemos ignorar ou gerar erro?
- Se após o parsing de OCORRENCIA não encontrarmos dados válidos, devemos ignorar ou gerar erro?
- Se após o parsing de TAGS não encontrarmos tags válidas, devemos ignorar ou gerar erro?

**Recomendação:** Ignorar silenciosamente (não gerar erro, apenas não processar).

---

### 4. Validação de Data na Coluna OCORRENCIA
**Dúvida:** A data na coluna OCORRENCIA está no formato `yyyy-mm-dd`. 

**Perguntas:**
- Devemos validar se a data é válida?
- O que fazer se a data for inválida? (ex: "2025-13-45")
- Devemos aceitar apenas formato `yyyy-mm-dd` ou também outros formatos?

**Recomendação:** Validar formato `yyyy-mm-dd` e lançar erro se inválido, ou usar o mesmo parser de data já existente no código.

---

### 5. Case Sensitivity nas Buscas
**Dúvidas:**
- A busca por `produto.descricao` deve ser case-sensitive ou case-insensitive?
- A busca por `ocorrencia.descricao` deve ser case-sensitive ou case-insensitive?

**Exemplo:**
Se já existe produto "GIR LEITEIRO" e tentamos inserir "Gir Leiteiro", devemos:
- A) Considerar como produto diferente e inserir?
- B) Considerar como o mesmo produto e usar o existente?

**Recomendação:** Usar busca case-insensitive (UPPER/LOWER) para evitar duplicatas.

---

### 6. Tratamento de Espaços e Trim
**Dúvida:** Devemos fazer `trim()` nos valores antes de:
- Buscar produtos existentes?
- Buscar ocorrências existentes?
- Inserir novos produtos?
- Inserir novas ocorrências?

**Recomendação:** Sempre fazer `trim()` para evitar duplicatas por espaços extras.

---

### 7. Ordem de Processamento
**Dúvida:** Qual a ordem correta de processamento?

**Opção A:**
1. Criar/salvar o lead
2. Processar OCORRENCIA
3. Processar TAGS

**Opção B:**
1. Processar OCORRENCIA (criar produtos e ocorrências necessários)
2. Processar TAGS (criar produtos necessários)
3. Criar/salvar o lead
4. Criar relacionamentos `lead_ocorrencia` e `leads_produto`

**Recomendação:** Opção B, pois precisamos do `leads_id` para criar os relacionamentos.

---

### 8. Transações e Rollback
**Dúvida:** O código atual processa linha a linha com commit individual. 

**Perguntas:**
- Se ocorrer erro ao processar OCORRENCIA ou TAGS de um lead, devemos:
  - A) Fazer rollback de todo o lead (incluindo o lead criado)?
  - B) Continuar com o próximo lead e reportar o erro?
  - C) Parar a importação completamente?

**Análise do Código Atual:**
O método `importLeads()` atualmente:
- Para no primeiro erro encontrado
- As linhas anteriores já foram salvas (commit automático do TypeORM)
- Retorna erro com `linhasImportadas: success`

**Recomendação:** Manter o mesmo comportamento: parar no primeiro erro e reportar quantas linhas foram importadas.

---

### 9. Performance e Otimização
**Dúvidas:**
- Para cada produto/ocorrencia, estamos fazendo uma query de busca. Isso pode ser lento para planilhas grandes.
- Devemos fazer batch inserts ou buscar todos de uma vez?

**Recomendação:** 
- Para produtos/ocorrencias: fazer busca única por lista de descrições (usando `IN`)
- Para `leads_produto`: verificar existência em batch antes de inserir

---

### 10. Estrutura da Tabela `lead_ocorrencia`
**Observação:** A tabela `lead_ocorrencia` tem um campo `produto_id`, o que sugere que cada registro relaciona:
- Um lead
- Uma ocorrência
- Um produto
- Uma data

**Confirmação:** Esta interpretação está correta? Cada produto na ocorrência gera um registro separado?

---

### 11. Campo `active` em `lead_ocorrencia`
**Dúvida:** O campo `active` em `lead_ocorrencia` deve sempre ser `true` na importação, ou há alguma lógica específica?

**Recomendação:** Sempre `true` na importação, conforme especificado.

---

### 12. Formato da Coluna TAGS
**Dúvida:** O formato da coluna TAGS é sempre `[tag1][tag2][tag3]` ou pode ter variações?

**Exemplos possíveis:**
- `[GIR LEITEIRO][Fêmea(s)]`
- `[GIR LEITEIRO] [Fêmea(s)]` (com espaços entre colchetes)
- `GIR LEITEIRO, Fêmea(s)` (sem colchetes, separado por vírgula)

**Recomendação:** Confirmar o formato exato esperado.

---

### 13. Duplicação de Produtos entre OCORRENCIA e TAGS
**Cenário:** 
- Coluna OCORRENCIA contém produto "GIR LEITEIRO"
- Coluna TAGS também contém "GIR LEITEIRO"

**Pergunta:** Devemos:
- A) Criar duas entradas em `leads_produto`? (não, pois violaria a constraint de unicidade)
- B) Verificar se já existe antes de inserir em `leads_produto`? (sim, já está especificado)

**Confirmação:** A verificação de existência em `leads_produto` já resolve isso, correto?

---

### 14. Nomes de Colunas na Planilha
**Dúvida:** Os nomes das colunas na planilha são exatamente:
- "APELIDO" (maiúsculas)
- "OCORRENCIA" (maiúsculas)
- "TAGS" (maiúsculas)

Ou podem ter variações como:
- "Apelido", "apelido", "APELIDO"
- "Ocorrência", "ocorrencia", "OCORRENCIA"
- "Tags", "tags", "TAGS"

**Recomendação:** O código atual já trata variações de case nos nomes de colunas. Manter o mesmo padrão.

---

## 📝 Resumo das Ações Necessárias

### 1. Criar Entidades TypeORM (se não existirem)
- [ ] `Produto` entity
- [ ] `Ocorrencia` entity (diferente de `Occurrence`)
- [ ] `LeadOcorrencia` entity
- [ ] `LeadsProduto` entity

### 2. Atualizar `leads-import.service.ts`
- [ ] Remover mapeamento de "Situacao"
- [ ] Adicionar mapeamento de "APELIDO" → `nome_fantasia_apelido`
- [ ] Adicionar mapeamento de "OCORRENCIA" → processamento complexo
- [ ] Adicionar mapeamento de "TAGS" → processamento de tags
- [ ] Criar método `parseOcorrencia()` para processar coluna OCORRENCIA
- [ ] Criar método `parseTags()` para processar coluna TAGS

### 3. Atualizar `leads.service.ts`
- [ ] Adicionar lógica para processar OCORRENCIA após criar lead
- [ ] Adicionar lógica para processar TAGS após criar lead
- [ ] Criar métodos auxiliares:
  - `findOrCreateProduto(descricao: string)`
  - `findOrCreateOcorrencia(descricao: string)`
  - `createLeadOcorrencia(leadId, ocorrenciaId, produtoId, data)`
  - `findOrCreateLeadsProduto(leadId, produtoId)`

### 4. Atualizar `import-lead.dto.ts`
- [ ] Adicionar campo `nome_fantasia_apelido?: string`
- [ ] Adicionar campo `ocorrencia?: string`
- [ ] Adicionar campo `tags?: string`
- [ ] Remover campo `status` (se ainda existir relacionado a Situacao)

### 5. Atualizar Documentação
- [ ] Atualizar `IMPORTACAO_LEADS.md` com novas colunas e estrutura

---

## ⚠️ Pontos de Atenção

1. **Performance:** Para planilhas grandes, o processamento de OCORRENCIA e TAGS pode ser lento devido a múltiplas queries. Considerar otimizações.

2. **Validação:** Validar formato de data em OCORRENCIA e formato de tags em TAGS.

3. **Case Sensitivity:** Definir se buscas são case-sensitive ou não.

4. **Tratamento de Erros:** Definir comportamento quando OCORRENCIA ou TAGS estiverem em formato inválido.

5. **Transações:** Considerar usar transações para garantir atomicidade (lead + ocorrências + produtos).

---

## 🎯 Próximos Passos

1. **Aguardar esclarecimentos** sobre as dúvidas levantadas
2. **Verificar existência** das entidades TypeORM
3. **Criar entidades** se necessário
4. **Implementar** as mudanças no código
5. **Testar** com planilhas de exemplo
6. **Atualizar documentação**

