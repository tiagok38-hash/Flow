
-- Reativar todas as categorias que foram desativadas
UPDATE categorias SET ativa = true WHERE ativa = false;
