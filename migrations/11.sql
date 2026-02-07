
-- Inserir categorias padrão de despesas para todos os usuários existentes
INSERT INTO categorias (id, nome, icone, user_id, ativa, created_at, updated_at)
SELECT 
  'cat-alimentacao-' || user_id, 'Alimentação', 'utensils', user_id, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT DISTINCT user_id FROM lancamentos WHERE user_id IS NOT NULL)
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Alimentação' AND user_id = (SELECT DISTINCT user_id FROM lancamentos WHERE user_id IS NOT NULL LIMIT 1));

INSERT INTO categorias (id, nome, icone, user_id, ativa, created_at, updated_at)
SELECT 
  'cat-moradia-' || user_id, 'Moradia', 'home', user_id, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT DISTINCT user_id FROM lancamentos WHERE user_id IS NOT NULL)
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Moradia' AND user_id = (SELECT DISTINCT user_id FROM lancamentos WHERE user_id IS NOT NULL LIMIT 1));

INSERT INTO categorias (id, nome, icone, user_id, ativa, created_at, updated_at)
SELECT 
  'cat-transporte-' || user_id, 'Transporte', 'bus', user_id, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT DISTINCT user_id FROM lancamentos WHERE user_id IS NOT NULL)
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Transporte' AND user_id = (SELECT DISTINCT user_id FROM lancamentos WHERE user_id IS NOT NULL LIMIT 1));

INSERT INTO categorias (id, nome, icone, user_id, ativa, created_at, updated_at)
SELECT 
  'cat-lazer-' || user_id, 'Lazer', 'gamepad', user_id, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT DISTINCT user_id FROM lancamentos WHERE user_id IS NOT NULL)
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Lazer' AND user_id = (SELECT DISTINCT user_id FROM lancamentos WHERE user_id IS NOT NULL LIMIT 1));

INSERT INTO categorias (id, nome, icone, user_id, ativa, created_at, updated_at)
SELECT 
  'cat-saude-' || user_id, 'Saúde', 'heart', user_id, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT DISTINCT user_id FROM lancamentos WHERE user_id IS NOT NULL)
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Saúde' AND user_id = (SELECT DISTINCT user_id FROM lancamentos WHERE user_id IS NOT NULL LIMIT 1));

INSERT INTO categorias (id, nome, icone, user_id, ativa, created_at, updated_at)
SELECT 
  'cat-educacao-' || user_id, 'Educação', 'book', user_id, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (SELECT DISTINCT user_id FROM lancamentos WHERE user_id IS NOT NULL)
WHERE NOT EXISTS (SELECT 1 FROM categorias WHERE nome = 'Educação' AND user_id = (SELECT DISTINCT user_id FROM lancamentos WHERE user_id IS NOT NULL LIMIT 1));
