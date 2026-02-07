
-- D1 não suporta ALTER TABLE para remover constraints
-- Vamos apenas garantir que futuras tabelas não tenham foreign keys
-- A tabela lancamentos atual já existe e funciona, apenas precisamos
-- normalizar para evitar erros futuros

-- Criar índices para melhorar performance (sem constraints)
CREATE INDEX IF NOT EXISTS idx_lancamentos_categoria ON lancamentos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_cartao ON lancamentos(cartao_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_user_data ON lancamentos(user_id, data);
CREATE INDEX IF NOT EXISTS idx_categorias_user ON categorias(user_id);
CREATE INDEX IF NOT EXISTS idx_cartoes_user ON cartoes(user_id);
