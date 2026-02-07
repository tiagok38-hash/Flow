
CREATE TABLE lancamentos_fixos (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('despesa', 'receita')),
  nome TEXT NOT NULL,
  categoria_id TEXT,
  valor REAL NOT NULL,
  icone TEXT NOT NULL DEFAULT 'circle',
  periodicidade TEXT NOT NULL CHECK (periodicidade IN ('diario', 'semanal', 'quinzenal', 'mensal')),
  dia_semana INTEGER CHECK (dia_semana BETWEEN 0 AND 6),
  dia_mes_1 INTEGER CHECK (dia_mes_1 BETWEEN 1 AND 31),
  dia_mes_2 INTEGER CHECK (dia_mes_2 BETWEEN 1 AND 31),
  ativo BOOLEAN NOT NULL DEFAULT true,
  proximo_lancamento DATE,
  user_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);
