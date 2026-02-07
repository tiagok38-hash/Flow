
-- Recriar categorias padrão se necessário
INSERT INTO categorias (id, nome, icone, ativa, limite_mensal, user_id) VALUES
('alimentacao-default', 'Alimentação', 'utensils', true, null, null),
('cat-default-doacao', 'Doação', 'circle', true, null, null),
('cat-7', 'Educação', 'book', true, null, null),
('cat-6', 'Higiene', 'sparkles', true, null, null),
('cat-4', 'Lazer', 'gamepad', true, null, null),
('cat-3', 'Moradia', 'home', true, null, null),
('cat-8', 'Outros', 'more-horizontal', true, null, null),
('cat-5', 'Saúde', 'heart', true, null, null),
('cat-2', 'Transporte', 'bus', true, null, null);
