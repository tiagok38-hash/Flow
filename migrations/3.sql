
ALTER TABLE categorias ADD COLUMN user_id TEXT;
ALTER TABLE cartoes ADD COLUMN user_id TEXT;
ALTER TABLE lancamentos ADD COLUMN user_id TEXT;
ALTER TABLE preferencias ADD COLUMN user_id TEXT;

CREATE INDEX idx_categorias_user_id ON categorias(user_id);
CREATE INDEX idx_cartoes_user_id ON cartoes(user_id);
CREATE INDEX idx_lancamentos_user_id ON lancamentos(user_id);
CREATE INDEX idx_preferencias_user_id ON preferencias(user_id);
