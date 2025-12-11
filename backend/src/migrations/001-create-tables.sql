-- Migration: Criação das tabelas iniciais
-- Execute este script no PostgreSQL para criar as tabelas

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    perfil VARCHAR(20) NOT NULL DEFAULT 'AGENTE' CHECK (perfil IN ('ADMIN', 'AGENTE')),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca por email
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_perfil ON usuarios(perfil);

-- Tabela de leads
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_entrada DATE NOT NULL,
    nome_razao_social VARCHAR(255) NOT NULL,
    nome_fantasia_apelido VARCHAR(255),
    telefone VARCHAR(255),
    email VARCHAR(255),
    uf VARCHAR(2) NOT NULL,
    municipio VARCHAR(255) NOT NULL,
    anotacoes TEXT,
    status TEXT[], -- Array de strings para multiselect
    itens_interesse TEXT[], -- Array de strings para multiselect
    origem_lead VARCHAR(50) CHECK (origem_lead IN (
        'CAMPANHA_MKT',
        'HABILITADOS',
        'BASE_RD',
        'NETWORKING',
        'WHATSAPP',
        'AGENTE_VENDAS',
        'BASE_CANAL_DO_CAMPO'
    )),
    vendedor_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_vendedor_id ON leads(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_leads_data_entrada ON leads(data_entrada);
CREATE INDEX IF NOT EXISTS idx_leads_nome_razao_social ON leads(nome_razao_social);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads USING GIN(status);
CREATE INDEX IF NOT EXISTS idx_leads_origem_lead ON leads(origem_lead);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir usuário admin padrão (senha: admin123)
-- IMPORTANTE: Altere a senha após o primeiro login!
-- Hash gerado com bcrypt para senha 'admin123'
INSERT INTO usuarios (nome, email, senha, perfil, ativo)
VALUES (
    'Administrador',
    'admin@crm.com',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- hash de 'admin123'
    'ADMIN',
    TRUE
) ON CONFLICT (email) DO NOTHING;

