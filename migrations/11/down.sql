
-- Remover categorias padrão inseridas
DELETE FROM categorias WHERE nome IN ('Alimentação', 'Moradia', 'Transporte', 'Lazer', 'Saúde', 'Educação') AND id LIKE 'cat-%';
