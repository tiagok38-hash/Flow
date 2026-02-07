
-- Inserir categorias padrão se não existirem
INSERT OR IGNORE INTO categorias (id, nome, icone, ativa, user_id) VALUES 
('cat_alimentacao', 'Alimentação', 'utensils', true, NULL),
('cat_moradia', 'Moradia', 'home', true, NULL),
('cat_transporte', 'Transporte', 'bus', true, NULL),
('cat_lazer', 'Lazer', 'gamepad', true, NULL),
('cat_educacao', 'Educação', 'book', true, NULL),
('cat_saude', 'Saúde', 'heart', true, NULL),
('cat_higiene', 'Higiene', 'sparkles', true, NULL),
('cat_investimento', 'Investimento', 'trending-up', true, NULL),
('cat_doacao', 'Doação', 'heart', true, NULL);
