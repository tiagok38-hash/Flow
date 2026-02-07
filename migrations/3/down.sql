
DROP INDEX idx_preferencias_user_id;
DROP INDEX idx_lancamentos_user_id;
DROP INDEX idx_cartoes_user_id;
DROP INDEX idx_categorias_user_id;

ALTER TABLE preferencias DROP COLUMN user_id;
ALTER TABLE lancamentos DROP COLUMN user_id;
ALTER TABLE cartoes DROP COLUMN user_id;
ALTER TABLE categorias DROP COLUMN user_id;
