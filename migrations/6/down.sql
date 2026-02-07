
-- Remover categorias padrão criadas
DELETE FROM categorias WHERE id IN (
  'alimentacao-default', 'moradia-default', 'transporte-default', 
  'lazer-default', 'educacao-default', 'saude-default', 
  'higiene-default', 'investimento-default', 'doacao-default'
);
