
-- Criar índices para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_categorias_user_id ON categorias(user_id);
CREATE INDEX IF NOT EXISTS idx_categorias_user_ativa ON categorias(user_id, ativa);

CREATE INDEX IF NOT EXISTS idx_cartoes_user_id ON cartoes(user_id);

CREATE INDEX IF NOT EXISTS idx_lancamentos_user_id ON lancamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_user_tipo ON lancamentos(user_id, tipo);
CREATE INDEX IF NOT EXISTS idx_lancamentos_user_competencia ON lancamentos(user_id, competencia);
CREATE INDEX IF NOT EXISTS idx_lancamentos_user_data ON lancamentos(user_id, data);
CREATE INDEX IF NOT EXISTS idx_lancamentos_categoria ON lancamentos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_cartao ON lancamentos(cartao_id);

CREATE INDEX IF NOT EXISTS idx_preferencias_user_id ON preferencias(user_id);
