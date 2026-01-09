# ✅ Resumo dos Esclarecimentos Recebidos

## 📋 Respostas Confirmadas

### ✅ 1. Entidades TypeORM
**Resposta:** NÃO existem - **Preciso criar todas as 4 entidades**

### ✅ 2. Processamento de Produtos na Coluna OCORRENCIA
**Resposta:** **CONFIRMADO - PROCESSAMENTO FINAL**
- ✅ **Fazer split por vírgula `,`**
- ✅ Os itens encontrados devem ser **concatenados com espaço em branco** (ou substituir vírgula por espaço)
- ✅ O resultado final é **UM único produto**
- ✅ **Cada ocorrência gera UM registro em `lead_ocorrencia`** (não múltiplos)

**Processamento Correto:**
```
Input: "2025-07-24#COMPRA:GIR LEITEIRO,Fêmea(s)"

Split por "|": (se houver múltiplas ocorrências)
Split por "#": [data, resto]
Split resto por ":": [descricao_ocorrencia, produtos_string]
  - descricao_ocorrencia = "COMPRA"
  - produtos_string = "GIR LEITEIRO,Fêmea(s)"
  
Processar produtos_string:
  - Split por ",": ["GIR LEITEIRO", "Fêmea(s)"]
  - Trim em cada item: ["GIR LEITEIRO", "Fêmea(s)"]
  - Concatenar com espaço: "GIR LEITEIRO Fêmea(s)"
  - OU simplesmente substituir vírgula por espaço: "GIR LEITEIRO Fêmea(s)"
  - produto_final = "GIR LEITEIRO Fêmea(s)"
```

**Resultado:**
- 1 entrada em `ocorrencia` (descricao: "COMPRA")
- 1 entrada em `produto` (descricao: "GIR LEITEIRO Fêmea(s)") ← **com espaço, sem vírgula**
- 1 entrada em `lead_ocorrencia` (leads_id, ocorrencia_id, produto_id, data)
- 1 entrada em `leads_produto` (se não existir)

### ✅ 3. Tratamento de Valores Vazios/Nulos
**Resposta:** **Ignorar silenciosamente** (não gerar erro)
- OCORRENCIA vazia → ignorar
- TAGS vazia → ignorar
- Parsing sem dados válidos → ignorar

### ✅ 4. Validação de Data
**Resposta:**
- ✅ Validar se a data é válida
- ✅ Se inválida → usar **data do dia atual** como padrão
- ✅ Aceitar outros formatos além de `yyyy-mm-dd` (usar parser existente)

### ✅ 5. Case Sensitivity
**Resposta:** **Case-insensitive** (maiúsculas e minúsculas como iguais)
- Busca por `produto.descricao` → case-insensitive
- Busca por `ocorrencia.descricao` → case-insensitive

### ✅ 6. Tratamento de Espaços e Trim
**Resposta:** **Sempre fazer trim()**
- Buscar produtos existentes → SIM
- Buscar ocorrências existentes → SIM
- Inserir novos produtos → SIM
- Inserir novas ocorrências → SIM

### ✅ 7. Ordem de Processamento
**Resposta:** **Opção A**
1. Criar/salvar o lead
2. Processar OCORRENCIA
3. Processar TAGS

**Tratamento de Erros:**
- Se erro ao processar OCORRENCIA ou TAGS → **Rollback completo do lead e parar importação**

### ✅ 8. Campo `active` em `lead_ocorrencia`
**Resposta:** **Sempre `true`** na importação

### ✅ 9. Formato da Coluna TAGS
**Resposta:** **Pode ter variações**
- Formato: `[tag1][tag2][tag3]` ou variações
- **Ignorar tudo que não estiver dentro de `[]`**

### ✅ 10. Duplicação de Produtos
**Resposta:** **Verificação resolve** - Um lead não pode ter mais de uma vez o mesmo produto

### ✅ 11. Nomes de Colunas
**Resposta:** **Podem ter variações** de maiúsculas e minúsculas

---

## ✅ TODAS AS DÚVIDAS ESCLARECIDAS

### ✅ Processamento de Produtos - CONFIRMADO

**Processamento Final:**
1. Fazer split por vírgula `,` na string de produtos
2. Fazer trim em cada item
3. Concatenar os itens com espaço em branco (ou substituir vírgula por espaço)
4. O resultado é UM único produto

**Exemplo:**
```
Input: "GIR LEITEIRO,Fêmea(s)"
Split por ",": ["GIR LEITEIRO", "Fêmea(s)"]
Trim: ["GIR LEITEIRO", "Fêmea(s)"]
Concatenar: "GIR LEITEIRO Fêmea(s)"
Produto final: "GIR LEITEIRO Fêmea(s)"
```

**Implementação:**
- Opção 1: `produtos.split(',').map(p => p.trim()).join(' ')`
- Opção 2: `produtos.replace(/,/g, ' ')` (mais simples)

---

## 📝 Checklist de Implementação

### Fase 1: Criar Entidades TypeORM
- [ ] `Produto` entity (`backend/src/produtos/entities/produto.entity.ts`)
- [ ] `Ocorrencia` entity (`backend/src/ocorrencias/entities/ocorrencia.entity.ts`)
- [ ] `LeadOcorrencia` entity (`backend/src/lead-ocorrencias/entities/lead-ocorrencia.entity.ts`)
- [ ] `LeadsProduto` entity (`backend/src/leads-produtos/entities/leads-produto.entity.ts`)
- [ ] Registrar entidades no `database.config.ts`

### Fase 2: Atualizar DTO
- [ ] Adicionar `nome_fantasia_apelido?: string` em `import-lead.dto.ts`
- [ ] Adicionar `ocorrencia?: string` em `import-lead.dto.ts`
- [ ] Adicionar `tags?: string` em `import-lead.dto.ts`
- [ ] Remover processamento de "Situacao" (se ainda existir)

### Fase 3: Atualizar Service de Importação
- [ ] Remover mapeamento de "Situacao" em `leads-import.service.ts`
- [ ] Adicionar mapeamento de "APELIDO" → `nome_fantasia_apelido`
- [ ] Adicionar mapeamento de "OCORRENCIA" → `ocorrencia`
- [ ] Adicionar mapeamento de "TAGS" → `tags`
- [ ] Criar método `parseOcorrencia(ocorrenciaString: string)` que retorna array de objetos
- [ ] Criar método `parseTags(tagsString: string)` que retorna array de strings

### Fase 4: Atualizar Service de Leads
- [ ] Adicionar repositórios para as novas entidades
- [ ] Criar método `findOrCreateProduto(descricao: string): Promise<Produto>`
  - Busca case-insensitive com trim
  - Se não encontrar, cria novo
- [ ] Criar método `findOrCreateOcorrencia(descricao: string): Promise<Ocorrencia>`
  - Busca case-insensitive com trim
  - Se não encontrar, cria novo
- [ ] Criar método `processOcorrencias(leadId: number, ocorrencias: any[]): Promise<void>`
  - Para cada ocorrência:
    - Valida/parseia data (se inválida, usa data atual)
    - Busca/cria ocorrência
    - Busca/cria produto (valor completo após `:`)
    - Cria registro em `lead_ocorrencia`
    - Verifica/cria registro em `leads_produto`
- [ ] Criar método `processTags(leadId: number, tags: string[]): Promise<void>`
  - Para cada tag:
    - Busca/cria produto
    - Verifica/cria registro em `leads_produto`
- [ ] Atualizar método `importLeads()` para:
  - Usar transação (QueryRunner) para garantir rollback
  - Após criar lead, processar OCORRENCIA
  - Após processar OCORRENCIA, processar TAGS
  - Se erro em qualquer etapa, fazer rollback e parar

### Fase 5: Validações e Tratamento de Erros
- [ ] Validar formato de data (aceitar múltiplos formatos)
- [ ] Se data inválida, usar data atual
- [ ] Ignorar silenciosamente valores vazios
- [ ] Fazer trim em todos os valores
- [ ] Buscas case-insensitive

### Fase 6: Testes
- [ ] Testar importação com coluna OCORRENCIA
- [ ] Testar importação com coluna TAGS
- [ ] Testar importação com coluna APELIDO
- [ ] Testar com valores vazios
- [ ] Testar com datas inválidas
- [ ] Testar com produtos duplicados
- [ ] Testar rollback em caso de erro

### Fase 7: Documentação
- [ ] Atualizar `IMPORTACAO_LEADS.md` com novas colunas
- [ ] Documentar formato de OCORRENCIA
- [ ] Documentar formato de TAGS

---

## ✅ Todas as Dúvidas Foram Esclarecidas?

### ✅ Esclarecidas:
1. ✅ Entidades TypeORM
2. ✅ Processamento de produtos (com ressalva)
3. ✅ Valores vazios
4. ✅ Validação de data
5. ✅ Case sensitivity
6. ✅ Trim
7. ✅ Ordem de processamento
8. ✅ Tratamento de erros
9. ✅ Campo active
10. ✅ Formato TAGS
11. ✅ Duplicação
12. ✅ Nomes de colunas

### ✅ Todos os Pontos Confirmados:
- ✅ **Processamento de produtos na OCORRENCIA**: 
  - Fazer split por vírgula
  - Concatenar itens com espaço (ou substituir vírgula por espaço)
  - Resultado: UM único produto por ocorrência

---

## 🎯 Pronto para Implementação?

**Status:** ✅ **SIM - TODAS AS DÚVIDAS FORAM ESCLARECIDAS**

**Próximo passo:** Aguardar autorização para iniciar a implementação.

