-- Migration: Criar tabela kanban_boards e ajustar tabela leads
-- Execute este script no PostgreSQL

-- 1. Criar tabela kanban_boards
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

-- 2. Criar índices para kanban_boards
CREATE INDEX IF NOT EXISTS idx_kanban_boards_tipo ON kanban_boards(tipo);
CREATE INDEX IF NOT EXISTS idx_kanban_boards_tipo_ordem ON kanban_boards(tipo, ordem);
CREATE INDEX IF NOT EXISTS idx_kanban_boards_agente_id ON kanban_boards(agente_id);
CREATE INDEX IF NOT EXISTS idx_kanban_boards_colaborador_id ON kanban_boards(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_kanban_boards_kanban_modelo_id ON kanban_boards(kanban_modelo_id);
CREATE INDEX IF NOT EXISTS idx_kanban_boards_usuario_dono ON kanban_boards(usuario_id_dono);
CREATE INDEX IF NOT EXISTS idx_kanban_boards_usuario_created ON kanban_boards(id_usuario_created_at);
CREATE INDEX IF NOT EXISTS idx_kanban_boards_kanban_status_id ON kanban_boards(kanban_status_id);

-- 3. Alterar vendedor_id na tabela leads para permitir NULL (board "Novos")
DO $$ 
BEGIN
  -- Verifica se a coluna é NOT NULL antes de alterar
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'leads' 
    AND column_name = 'vendedor_id' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE leads ALTER COLUMN vendedor_id DROP NOT NULL;
  END IF;
END $$;

-- 4. Adicionar campo kanban_status_id na tabela leads
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'leads' 
    AND column_name = 'kanban_status_id'
  ) THEN
    ALTER TABLE leads 
    ADD COLUMN kanban_status_id INTEGER NULL REFERENCES kanban_status(kanban_status_id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. Criar índice para kanban_status_id em leads
CREATE INDEX IF NOT EXISTS idx_leads_kanban_status_id ON leads(kanban_status_id);

