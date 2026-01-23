-- ============================================
-- SOLUÇÃO FINAL: Executar diretamente
-- ============================================
-- IMPORTANTE: Execute este comando DIRETAMENTE, 
-- não dentro de função ou bloco DO

-- Se der erro dizendo que já existe, ignore e continue
ALTER TYPE usuarios_perfil_enum ADD VALUE 'COLABORADOR';

-- ============================================
-- Se o comando acima funcionar, continue com o resto:
-- ============================================

-- Adicionar campo usuario_id_pai
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS usuario_id_pai INTEGER NULL;

-- Adicionar foreign key (pode dar erro se já existir, ignore)
ALTER TABLE usuarios 
ADD CONSTRAINT fk_usuarios_usuario_id_pai 
FOREIGN KEY (usuario_id_pai) 
REFERENCES usuarios(id) 
ON DELETE RESTRICT;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_usuarios_usuario_id_pai 
ON usuarios(usuario_id_pai);

-- Adicionar campo usuario_id_colaborador em leads
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS usuario_id_colaborador INTEGER NULL;

-- Adicionar foreign key (pode dar erro se já existir, ignore)
ALTER TABLE leads 
ADD CONSTRAINT fk_leads_usuario_id_colaborador 
FOREIGN KEY (usuario_id_colaborador) 
REFERENCES usuarios(id) 
ON DELETE SET NULL;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_leads_usuario_id_colaborador 
ON leads(usuario_id_colaborador);









