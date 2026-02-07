
DELETE FROM categorias WHERE id IN (
  'cat_alimentacao', 'cat_moradia', 'cat_transporte', 'cat_lazer', 
  'cat_educacao', 'cat_saude', 'cat_higiene', 'cat_investimento', 'cat_doacao'
);
