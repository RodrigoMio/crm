# 🚀 Instruções Rápidas: Corrigir Erro do Backend

## ⚠️ Problema Atual

O backend não está iniciando porque a tabela `leads` tem `id` como VARCHAR, mas a entidade espera INTEGER.

## ✅ Solução Rápida (3 passos)

### Passo 1: Executar Script SQL no Banco

Acesse o painel PostgreSQL da Redehost e execute este script:

```sql
-- Verificar tipo atual
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' AND column_name = 'id';

-- Se for VARCHAR, execute:
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS occurrences CASCADE;

CREATE TABLE leads (
    id SERIAL PRIMARY KEY,
    data_entrada DATE NOT NULL,
    nome_razao_social VARCHAR(255) NOT NULL,
    nome_fantasia_apelido VARCHAR(255),
    telefone VARCHAR(255),
    email VARCHAR(255),
    uf VARCHAR(2),
    municipio VARCHAR(255),
    anotacoes TEXT,
    status TEXT[],
    itens_interesse TEXT[],
    origem_lead VARCHAR(50) CHECK (origem_lead IN (
        'CAMPANHA_MKT', 'HABILITADOS', 'BASE_RD', 'NETWORKING',
        'WHATSAPP', 'AGENTE_VENDAS', 'BASE_CANAL_DO_CAMPO'
    )),
    vendedor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    usuario_id_colaborador INTEGER NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leads_vendedor_id ON leads(vendedor_id);
CREATE INDEX idx_leads_data_entrada ON leads(data_entrada);
CREATE INDEX idx_leads_nome_razao_social ON leads(nome_razao_social);
CREATE INDEX idx_leads_status ON leads USING GIN(status);
CREATE INDEX idx_leads_origem_lead ON leads(origem_lead);
CREATE INDEX idx_leads_usuario_id_colaborador ON leads(usuario_id_colaborador);

-- Recriar tabela occurrences
CREATE TABLE IF NOT EXISTS occurrences (
    id SERIAL PRIMARY KEY,
    leads_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    usuarios_id INTEGER NOT NULL REFERENCES usuarios(id),
    texto TEXT NOT NULL,
    tipo VARCHAR(50) CHECK (tipo IN ('SISTEMA', 'USUARIO')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_occurrences_lead_id ON occurrences (leads_id);
```

### Passo 2: Reiniciar o Backend

```bash
cd backend
npm run start:dev
```

### Passo 3: Verificar se Iniciou

O backend deve mostrar:
```
[Nest] Application successfully started
```

Se ainda houver erro, verifique os logs no terminal.

## 🔍 Verificação

Após executar, teste no navegador:
- Acesse `http://localhost:3000`
- Faça login
- Verifique se os leads aparecem

---

**⚠️ IMPORTANTE:** O script acima APAGA todos os dados das tabelas `leads` e `occurrences`. Se você tem dados importantes, faça backup antes!






