
-- Remover categorias de receita padrão
DELETE FROM categorias WHERE id IN ('receita-salario', 'receita-freelancer', 'receita-dividendo');
