
-- Primeiro, vamos limpar as categorias duplicadas mantendo apenas a mais antiga de cada nome para user_id NULL
-- e apenas uma categoria por nome por usuário

-- Criar uma tabela temporária com as categorias que queremos manter
CREATE TEMPORARY TABLE categorias_keep AS
SELECT MIN(id) as id, nome, user_id
FROM categorias 
WHERE ativa = true
GROUP BY nome, COALESCE(user_id, 'NULL');

-- Desativar todas as categorias duplicadas (manter apenas as que estão na tabela temp)
UPDATE categorias 
SET ativa = false 
WHERE ativa = true 
AND id NOT IN (SELECT id FROM categorias_keep);

-- Limpar a tabela temporária
DROP TABLE categorias_keep;
