
-- Limpar categorias duplicadas (manter apenas as do usuário)
DELETE FROM categorias WHERE user_id IS NULL;
