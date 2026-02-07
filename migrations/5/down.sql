
DELETE FROM categorias WHERE id IN (
  'cat-default-alimentacao', 'cat-default-moradia', 'cat-default-transporte', 
  'cat-default-lazer', 'cat-default-educacao', 'cat-default-saude', 
  'cat-default-higiene', 'cat-default-investimento', 'cat-default-doacao'
);
