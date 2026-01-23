-- Migration: Alterar coluna id de leads de VARCHAR para INT
-- Execute este script no PostgreSQL ANTES de iniciar o backend

-- IMPORTANTE: Este script assume que você já fez backup dos dados!

-- 1. Verificar se a coluna id já é INT
DO $$ 
BEGIN
    -- Se a coluna já for integer, não faz nada
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'id' 
        AND data_type = 'integer'
    ) THEN
        RAISE NOTICE 'Coluna id já é INTEGER. Nenhuma alteração necessária.';
    ELSE
        -- Se for VARCHAR ou UUID, precisa converter
        RAISE NOTICE 'Coluna id precisa ser convertida para INTEGER.';
        
        -- IMPORTANTE: Se você tem dados na tabela, precisa fazer backup primeiro!
        -- Este script remove todos os dados da tabela leads
        
        -- Remover foreign keys que dependem de leads.id
        ALTER TABLE IF EXISTS occurrences DROP CONSTRAINT IF EXISTS occurrences_leads_id_fkey;
        
        -- Remover a tabela leads (isso apaga todos os dados!)
        DROP TABLE IF EXISTS leads CASCADE;
        
        -- Recriar a tabela com id INTEGER
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
                'CAMPANHA_MKT',
                'HABILITADOS',
                'BASE_RD',
                'NETWORKING',
                'WHATSAPP',
                'AGENTE_VENDAS',
                'BASE_CANAL_DO_CAMPO'
            )),
            vendedor_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
            usuario_id_colaborador INTEGER NULL REFERENCES usuarios(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Recriar índices
        CREATE INDEX IF NOT EXISTS idx_leads_vendedor_id ON leads(vendedor_id);
        CREATE INDEX IF NOT EXISTS idx_leads_data_entrada ON leads(data_entrada);
        CREATE INDEX IF NOT EXISTS idx_leads_nome_razao_social ON leads(nome_razao_social);
        CREATE INDEX IF NOT EXISTS idx_leads_status ON leads USING GIN(status);
        CREATE INDEX IF NOT EXISTS idx_leads_origem_lead ON leads(origem_lead);
        CREATE INDEX IF NOT EXISTS idx_leads_usuario_id_colaborador ON leads(usuario_id_colaborador);
        
        -- Recriar foreign key para occurrences (se a tabela existir)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'occurrences') THEN
            ALTER TABLE occurrences 
            ADD CONSTRAINT occurrences_leads_id_fkey 
            FOREIGN KEY (leads_id) 
            REFERENCES leads(id) 
            ON DELETE CASCADE;
        END IF;
        
        RAISE NOTICE 'Tabela leads recriada com id INTEGER.';
    END IF;
END $$;









