
-- Inserir categorias padrão se não existirem
INSERT OR IGNORE INTO categorias (id, nome, icone, ativa, limite_mensal, user_id)
VALUES 
  ('cat-default-alimentacao', 'Alimentação', 'utensils', true, null, null),
  ('cat-default-moradia', 'Moradia', 'home', true, null, null),
  ('cat-default-transporte', 'Transporte', 'bus', true, null, null),
  ('cat-default-lazer', 'Lazer', 'gamepad', true, null, null),
  ('cat-default-educacao', 'Educação', 'book', true, null, null),
  ('cat-default-saude', 'Saúde', 'heart', true, null, null),
  ('cat-default-higiene', 'Higiene', 'sparkles', true, null, null),
  ('cat-default-investimento', 'Investimento', 'trending-up', true, null, null),
  ('cat-default-doacao', 'Doação', 'circle', true, null, null);
