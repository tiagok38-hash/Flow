import z from "zod";

// Schemas de validação para categorias
export const CategoriaSchema = z.object({
  id: z.string(),
  nome: z.string(),
  icone: z.string(),
  ativa: z.boolean(),
  limite_mensal: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Categoria = z.infer<typeof CategoriaSchema>;

// Schemas de validação para cartões
export const CartaoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  final4: z.string().nullable(),
  fechamento_dia: z.number().int().min(1).max(31),
  vencimento_dia: z.number().int().min(1).max(31),
  limite_mensal: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Cartao = z.infer<typeof CartaoSchema>;

// Schemas de validação para lançamentos
export const LancamentoSchema = z.object({
  id: z.string(),
  tipo: z.enum(['despesa', 'receita']),
  descricao: z.string(),
  categoria_id: z.string().nullable(),
  valor: z.number(),
  data: z.string(),
  forma_pagamento: z.enum(['Dinheiro', 'Pix', 'Débito', 'Cartão']),
  cartao_id: z.string().nullable(),
  status: z.enum(['pago', 'pendente']),
  anexo_url: z.string().nullable(),
  competencia: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Lancamento = z.infer<typeof LancamentoSchema> & {
  categoria_nome?: string;
  categoria_icone?: string;
};

// Schema para criar novo lançamento
export const NovoLancamentoSchema = z.object({
  tipo: z.enum(['despesa', 'receita']),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  categoria_id: z.string().optional(),
  valor: z.number().positive('Valor deve ser positivo'),
  data: z.string(),
  forma_pagamento: z.enum(['Dinheiro', 'Pix', 'Débito', 'Cartão']),
  cartao_id: z.string().optional(),
});

export type NovoLancamento = z.infer<typeof NovoLancamentoSchema>;

// Schema para dashboard stats
export const DashboardStatsSchema = z.object({
  saldo_periodo: z.number(),
  total_receitas: z.number(),
  total_despesas: z.number(),
  categoria_mais_gasta: z.object({
    nome: z.string(),
    valor: z.number(),
  }).nullable(),
});

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

// Schema para gasto por categoria
export const GastoPorCategoriaSchema = z.object({
  categoria_id: z.string(),
  categoria_nome: z.string(),
  categoria_icone: z.string(),
  total: z.number(),
});

export type GastoPorCategoria = z.infer<typeof GastoPorCategoriaSchema>;
