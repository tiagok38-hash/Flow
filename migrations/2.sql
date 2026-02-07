
-- Inserir algumas categorias padrão se não existirem
INSERT OR IGNORE INTO categorias (id, nome, icone, ativa, created_at, updated_at) VALUES
('cat-receita-1', 'Salário', 'trending-up', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-receita-2', 'Freelance', 'trending-up', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-receita-3', 'Investimentos', 'trending-up', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat-receita-4', 'Vendas', 'trending-up', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
