
-- Tabela de categorias
CREATE TABLE categorias (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  icone TEXT NOT NULL DEFAULT 'circle',
  ativa BOOLEAN NOT NULL DEFAULT true,
  limite_mensal REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de cartões
CREATE TABLE cartoes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  final4 TEXT,
  fechamento_dia INTEGER NOT NULL,
  vencimento_dia INTEGER NOT NULL,
  limite_mensal REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de lançamentos
CREATE TABLE lancamentos (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('despesa', 'receita')),
  descricao TEXT NOT NULL,
  categoria_id TEXT,
  valor REAL NOT NULL,
  data DATE NOT NULL,
  forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('Dinheiro', 'Pix', 'Débito', 'Cartão')),
  cartao_id TEXT,
  status TEXT NOT NULL DEFAULT 'pago' CHECK (status IN ('pago', 'pendente')),
  anexo_url TEXT,
  competencia TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id),
  FOREIGN KEY (cartao_id) REFERENCES cartoes(id)
);

-- Tabela de preferências
CREATE TABLE preferencias (
  id TEXT PRIMARY KEY,
  alerta_percentual_padrao REAL NOT NULL DEFAULT 0.9,
  moeda_base TEXT NOT NULL DEFAULT 'BRL',
  timezone TEXT NOT NULL DEFAULT 'America/Recife',
  resumo_semanal BOOLEAN NOT NULL DEFAULT false,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inserir categorias padrão
INSERT INTO categorias (id, nome, icone) VALUES
  ('cat-1', 'Alimentação', 'utensils'),
  ('cat-2', 'Transporte', 'bus'),
  ('cat-3', 'Moradia', 'home'),
  ('cat-4', 'Lazer', 'gamepad'),
  ('cat-5', 'Saúde', 'heart'),
  ('cat-6', 'Higiene', 'sparkles'),
  ('cat-7', 'Educação', 'book'),
  ('cat-8', 'Outros', 'more-horizontal');

-- Inserir cartões de exemplo
INSERT INTO cartoes (id, nome, final4, fechamento_dia, vencimento_dia) VALUES
  ('card-1', 'Visa Nubank', '1234', 7, 15),
  ('card-2', 'Master Itaú', '5678', 10, 20);

-- Inserir preferência padrão
INSERT INTO preferencias (id) VALUES ('pref-1');

-- Inserir lançamentos de exemplo
INSERT INTO lancamentos (id, tipo, descricao, categoria_id, valor, data, forma_pagamento, competencia) VALUES
  ('lanc-1', 'despesa', 'Mercado', 'cat-1', -250.00, '2025-09-05', 'Débito', '2025-09'),
  ('lanc-2', 'despesa', 'Gasolina', 'cat-2', -120.00, '2025-09-08', 'Pix', '2025-09'),
  ('lanc-3', 'receita', 'Salário', NULL, 5000.00, '2025-09-11', 'Pix', '2025-09');
