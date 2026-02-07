
-- Restaurar as categorias removidas
UPDATE categorias SET ativa = true WHERE nome IN ('Salário', 'Freelance', 'Freelancer', 'Vendas', 'Dividendo', 'Investimentos', 'Investimento');
