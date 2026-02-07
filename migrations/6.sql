
-- Adicionar categorias padrão únicas no sistema se não existirem
INSERT OR IGNORE INTO categorias (id, nome, icone, ativa, limite_mensal, user_id)
VALUES 
  ('alimentacao-default', 'Alimentação', 'utensils', true, null, null),
  ('moradia-default', 'Moradia', 'home', true, null, null),
  ('transporte-default', 'Transporte', 'bus', true, null, null),
  ('lazer-default', 'Lazer', 'gamepad', true, null, null),
  ('educacao-default', 'Educação', 'book', true, null, null),
  ('saude-default', 'Saúde', 'heart', true, null, null),
  ('higiene-default', 'Higiene', 'sparkles', true, null, null),
  ('investimento-default', 'Investimento', 'trending-up', true, null, null),
  ('doacao-default', 'Doação', 'circle', true, null, null);
