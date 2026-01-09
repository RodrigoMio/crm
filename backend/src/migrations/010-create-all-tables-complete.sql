-- Migration: Criação completa de todas as tabelas do sistema
-- Execute este script no PostgreSQL para criar todas as tabelas do zero
-- Esta migration reflete o estado atual do sistema após todas as alterações

-- ============================================================================
-- 1. TABELA DE USUÁRIOS
-- ============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    perfil VARCHAR(20) NOT NULL DEFAULT 'AGENTE' CHECK (perfil IN ('ADMIN', 'AGENTE', 'COLABORADOR')),
    ativo BOOLEAN DEFAULT TRUE,
    usuario_id_pai INTEGER NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_perfil ON usuarios(perfil);
CREATE INDEX IF NOT EXISTS idx_usuarios_usuario_id_pai ON usuarios(usuario_id_pai);

-- ============================================================================
-- 2. TABELA DE LEADS
-- ============================================================================
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    data_entrada DATE NOT NULL,
    nome_razao_social VARCHAR(255) NOT NULL,
    nome_fantasia_apelido VARCHAR(255),
    telefone VARCHAR(255),
    email VARCHAR(255),
    uf VARCHAR(2),
    municipio VARCHAR(255),
    anotacoes TEXT,
    origem_lead VARCHAR(50) CHECK (origem_lead IN (
        'CAMPANHA_MKT',
        'HABILITADOS',
        'BASE_RD',
        'NETWORKING',
        'WHATSAPP',
        'AGENTE_VENDAS',
        'BASE_CANAL_DO_CAMPO'
    )),
    vendedor_id INTEGER NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    usuario_id_colaborador INTEGER NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    kanban_status_id INTEGER NULL,
    total_conversoes INTEGER NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para leads
CREATE INDEX IF NOT EXISTS idx_leads_vendedor_id ON leads(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_leads_data_entrada ON leads(data_entrada);
CREATE INDEX IF NOT EXISTS idx_leads_nome_razao_social ON leads(nome_razao_social);
CREATE INDEX IF NOT EXISTS idx_leads_origem_lead ON leads(origem_lead);
CREATE INDEX IF NOT EXISTS idx_leads_usuario_id_colaborador ON leads(usuario_id_colaborador);
CREATE INDEX IF NOT EXISTS idx_leads_kanban_status_id ON leads(kanban_status_id);

-- ============================================================================
-- 3. TABELAS DE KANBAN
-- ============================================================================

-- 3.1. Tabela kanban_modelo
CREATE TABLE IF NOT EXISTS kanban_modelo (
    kanban_modelo_id SERIAL PRIMARY KEY,
    descricao VARCHAR(50),
    active BOOLEAN DEFAULT TRUE
);

-- 3.2. Tabela kanban_status
CREATE TABLE IF NOT EXISTS kanban_status (
    kanban_status_id SERIAL PRIMARY KEY,
    descricao VARCHAR(50),
    bg_color VARCHAR(10),
    text_color VARCHAR(10),
    active BOOLEAN DEFAULT TRUE
);

-- 3.3. Tabela kanban_modelo_status (relacionamento muitos-para-muitos)
CREATE TABLE IF NOT EXISTS kanban_modelo_status (
    kanban_modelo_status_id SERIAL PRIMARY KEY,
    kanban_modelo_id INTEGER NOT NULL REFERENCES kanban_modelo(kanban_modelo_id) ON DELETE CASCADE,
    kanban_status_id INTEGER NOT NULL REFERENCES kanban_status(kanban_status_id) ON DELETE CASCADE
);

-- Índices para kanban_modelo_status
CREATE INDEX IF NOT EXISTS idx_kanban_modelo_status_modelo ON kanban_modelo_status(kanban_modelo_id);
CREATE INDEX IF NOT EXISTS idx_kanban_modelo_status_status ON kanban_modelo_status(kanban_status_id);

-- 3.4. Tabela kanban_boards
CREATE TABLE IF NOT EXISTS kanban_boards (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(20) NOT NULL,
    cor_hex VARCHAR(7) NOT NULL,
    usuario_id_dono INTEGER NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    agente_id INTEGER NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    colaborador_id INTEGER NULL REFERENCES usuarios(id) ON DELETE SET NULL,
    kanban_modelo_id INTEGER NULL REFERENCES kanban_modelo(kanban_modelo_id) ON DELETE SET NULL,
    ordem INTEGER NOT NULL DEFAULT 0,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ADMIN', 'AGENTE', 'COLABORADOR')),
    kanban_status_id INTEGER NULL REFERENCES kanban_status(kanban_status_id) ON DELETE SET NULL,
    id_usuario_created_at INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para kanban_boards
CREATE INDEX IF NOT EXISTS idx_kanban_boards_tipo ON kanban_boards(tipo);
CREATE INDEX IF NOT EXISTS idx_kanban_boards_tipo_ordem ON kanban_boards(tipo, ordem);
CREATE INDEX IF NOT EXISTS idx_kanban_boards_agente_id ON kanban_boards(agente_id);
CREATE INDEX IF NOT EXISTS idx_kanban_boards_colaborador_id ON kanban_boards(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_kanban_boards_kanban_modelo_id ON kanban_boards(kanban_modelo_id);
CREATE INDEX IF NOT EXISTS idx_kanban_boards_usuario_dono ON kanban_boards(usuario_id_dono);
CREATE INDEX IF NOT EXISTS idx_kanban_boards_usuario_created ON kanban_boards(id_usuario_created_at);
CREATE INDEX IF NOT EXISTS idx_kanban_boards_kanban_status_id ON kanban_boards(kanban_status_id);

-- Adicionar foreign key de kanban_status_id em leads (após criar kanban_status)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'leads_kanban_status_id_fkey'
    ) THEN
        ALTER TABLE leads 
        ADD CONSTRAINT leads_kanban_status_id_fkey 
        FOREIGN KEY (kanban_status_id) 
        REFERENCES kanban_status(kanban_status_id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- 4. TABELAS DE PRODUTOS E OCORRÊNCIAS
-- ============================================================================

-- 4.1. Tabela produto
CREATE TABLE IF NOT EXISTS produto (
    produto_id SERIAL PRIMARY KEY,
    descricao VARCHAR(100) NOT NULL
);

-- 4.2. Tabela ocorrencia
CREATE TABLE IF NOT EXISTS ocorrencia (
    ocorrencia_id SERIAL PRIMARY KEY,
    descricao VARCHAR(50) NOT NULL
);

-- 4.3. Tabela lead_ocorrencia (relacionamento muitos-para-muitos)
CREATE TABLE IF NOT EXISTS lead_ocorrencia (
    lead_ocorrencia_id SERIAL PRIMARY KEY,
    leads_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    ocorrencia_id INTEGER NOT NULL REFERENCES ocorrencia(ocorrencia_id) ON DELETE CASCADE,
    produto_id INTEGER NOT NULL REFERENCES produto(produto_id) ON DELETE CASCADE,
    data DATE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para lead_ocorrencia
CREATE INDEX IF NOT EXISTS idx_lead_ocorrencia_leads_id ON lead_ocorrencia(leads_id);
CREATE INDEX IF NOT EXISTS idx_lead_ocorrencia_ocorrencia_id ON lead_ocorrencia(ocorrencia_id);
CREATE INDEX IF NOT EXISTS idx_lead_ocorrencia_produto_id ON lead_ocorrencia(produto_id);

-- 4.4. Tabela leads_produto (relacionamento muitos-para-muitos)
CREATE TABLE IF NOT EXISTS leads_produto (
    leads_produto_id SERIAL PRIMARY KEY,
    leads_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    produto_id INTEGER NOT NULL REFERENCES produto(produto_id) ON DELETE CASCADE
);

-- Índices para leads_produto
CREATE INDEX IF NOT EXISTS idx_leads_produto_leads_id ON leads_produto(leads_id);
CREATE INDEX IF NOT EXISTS idx_leads_produto_produto_id ON leads_produto(produto_id);

-- ============================================================================
-- 5. TABELA DE AGENDAMENTOS (APPOINTMENTS)
-- ============================================================================

-- 5.1. Criar enum para status de agendamento
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'appointment_status') THEN
        CREATE TYPE appointment_status AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
    END IF;
END $$;

-- 5.2. Tabela appointments
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    data_agendamento TIMESTAMPTZ NOT NULL,
    status appointment_status NOT NULL DEFAULT 'SCHEDULED',
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para appointments
CREATE INDEX IF NOT EXISTS idx_appointments_lead_id ON appointments(lead_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_data_agendamento ON appointments(data_agendamento);
CREATE INDEX IF NOT EXISTS idx_appointments_usuario_id ON appointments(usuario_id);

-- Índice único parcial para garantir apenas um SCHEDULED por lead
CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_lead_scheduled 
ON appointments(lead_id) 
WHERE status = 'SCHEDULED';

-- ============================================================================
-- 6. TABELA DE OCURRENCES (Ocorrências do sistema)
-- ============================================================================

CREATE TABLE IF NOT EXISTS occurrences (
    id SERIAL PRIMARY KEY,
    leads_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    usuarios_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
    texto TEXT NOT NULL,
    tipo VARCHAR(50) CHECK (tipo IN ('SISTEMA', 'USUARIO')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para occurrences
CREATE INDEX IF NOT EXISTS idx_occurrences_leads_id ON occurrences(leads_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_usuarios_id ON occurrences(usuarios_id);
CREATE INDEX IF NOT EXISTS idx_occurrences_tipo ON occurrences(tipo);

-- ============================================================================
-- 7. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE updated_at
-- ============================================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para usuarios
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON usuarios;
CREATE TRIGGER update_usuarios_updated_at 
BEFORE UPDATE ON usuarios
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Trigger para leads
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at 
BEFORE UPDATE ON leads
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Trigger para kanban_boards
DROP TRIGGER IF EXISTS trigger_update_kanban_boards_updated_at ON kanban_boards;
CREATE TRIGGER trigger_update_kanban_boards_updated_at
BEFORE UPDATE ON kanban_boards
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger para appointments
DROP TRIGGER IF EXISTS trigger_update_appointments_updated_at ON appointments;
CREATE TRIGGER trigger_update_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. INSERIR USUÁRIO ADMIN PADRÃO (OPCIONAL)
-- ============================================================================

-- Inserir usuário admin padrão (senha: admin123)
-- Hash gerado com bcrypt para senha 'admin123'
-- IMPORTANTE: Altere a senha após o primeiro login!
INSERT INTO usuarios (nome, email, senha, perfil, ativo)
VALUES (
    'Administrador',
    'admin@crm.com',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- hash de 'admin123'
    'ADMIN',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

