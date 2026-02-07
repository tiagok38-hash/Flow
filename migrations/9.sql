
-- Remover categorias de receita que estão aparecendo como categorias de despesa
UPDATE categorias SET ativa = false WHERE nome IN ('Salário', 'Freelance', 'Freelancer', 'Vendas', 'Dividendo', 'Investimentos', 'Investimento') AND (user_id IS NULL OR user_id IS NOT NULL);
