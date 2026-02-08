import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/react-app/supabaseClient';
import { Categoria, Lancamento, NovoLancamento, GastoPorCategoria, DashboardStats } from '@/shared/types';
import { useSupabaseQuery } from './useSupabaseQuery';

// --- Helpers de Data ---

export function getDataAtualBrasil(): Date {
  const data = new Date();
  const brasilString = data.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" });
  return new Date(brasilString);
}

export function getDataStringBrasil(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function getPeriodoRange(periodo: string): { start: string, end: string } {
  const hoje = getDataAtualBrasil();
  const year = hoje.getFullYear();
  const month = hoje.getMonth();

  let start = new Date(year, month, 1);
  let end = new Date(year, month + 1, 0); // Ultimo dia do mês

  if (periodo === 'hoje') {
    start = new Date(hoje);
    end = new Date(hoje);
  } else if (periodo === 'semana') {
    const day = hoje.getDay();
    const diff = hoje.getDate() - day + (day === 0 ? -6 : 1);
    start = new Date(hoje.setDate(diff));
    end = new Date(start);
    end.setDate(start.getDate() + 6);
  } else if (periodo === 'mes-passado') {
    start = new Date(year, month - 1, 1);
    end = new Date(year, month, 0);
  } else if (periodo === 'ano') {
    start = new Date(year, 0, 1);
    end = new Date(year, 11, 31);
  } else if (periodo.startsWith('custom:')) {
    const parts = periodo.split(':');
    if (parts.length === 3) {
      return { start: parts[1], end: parts[2] };
    }
  }

  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };
  return { start: fmt(start), end: fmt(end) };
}

// --- Hooks de Leitura ---

export function useCategorias() {
  const { data, loading, error, refetch } = useSupabaseQuery<Categoria[]>('categorias', {
    order: { column: 'nome', ascending: true },
    filters: { ativa: true }
  });
  return { data: data || [], loading, error, refetch };
}

export function useCartoes() {
  const { data, loading, error, refetch } = useSupabaseQuery<any[]>('cartoes', {
    order: { column: 'nome', ascending: true }
  });
  return { data: data || [], loading, error, refetch };
}

export function useLancamentosFixos() {
  const { data, loading, error, refetch } = useSupabaseQuery<any[]>('lancamentos_fixos', {
    order: { column: 'nome', ascending: true }
  });
  return { data: data || [], loading, error, refetch };
}

export function useLancamentos(periodo: string = 'mes-atual') {
  const [data, setData] = useState<Lancamento[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* 
     Monitora a data atual para garantir que o filtro de 'mes-atual' atualize automaticamente
     quando virar o mês (00:00 de Brasília do dia 01), zerando os totais visualmente.
  */
  const [currentDate, setCurrentDate] = useState(getDataAtualBrasil().toDateString());

  useEffect(() => {
    const checkDate = () => {
      const now = getDataAtualBrasil().toDateString();
      if (now !== currentDate) {
        setCurrentDate(now);
      }
    };
    // Verifica a cada minuto
    const timer = setInterval(checkDate, 60000);
    return () => clearInterval(timer);
  }, [currentDate]);

  const { start, end } = useMemo(() => getPeriodoRange(periodo), [periodo, currentDate]);

  const fetchLancamentos = useCallback(async () => {
    setLoading(true);
    try {
      const { data: lancamentos, error } = await supabase
        .from('lancamentos')
        .select(`
          *,
          categoria:categorias(nome, icone)
        `)
        .gte('data', start)
        .lte('data', end)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = lancamentos?.map((l: any) => ({
        ...l,
        categoria_nome: l.categoria?.nome,
        categoria_icone: l.categoria?.icone
      })) || [];

      setData(formatted);
    } catch (err: any) {
      console.error('Erro ao buscar lançamentos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    fetchLancamentos();
    const handleUpdate = () => fetchLancamentos();
    window.addEventListener('financeDataUpdated', handleUpdate);
    return () => window.removeEventListener('financeDataUpdated', handleUpdate);
  }, [fetchLancamentos]);

  return { data, loading, error, refetch: fetchLancamentos };
}

export function useDashboardStats(periodo: string = 'mes-atual') {
  const { data: lancamentos, loading, refetch } = useLancamentos(periodo);

  const stats = useMemo<DashboardStats | null>(() => {
    if (!lancamentos) return null;

    let totalReceitas = 0;
    let totalDespesas = 0;
    const gastosPorCategoria: Record<string, number> = {};
    const nomesCategorias: Record<string, string> = {};
    const iconesCategorias: Record<string, string> = {};
    const receitasPorCategoria: Record<string, number> = {};

    lancamentos.forEach(l => {
      const val = Math.abs(Number(l.valor));
      if (l.tipo === 'receita') {
        totalReceitas += val;
        if (l.categoria_id) {
          receitasPorCategoria[l.categoria_id] = (receitasPorCategoria[l.categoria_id] || 0) + val;
          nomesCategorias[l.categoria_id] = l.categoria_nome || 'Sem Categoria';
          iconesCategorias[l.categoria_id] = l.categoria_icone || 'circle';
        }
      } else if (l.tipo === 'despesa') {
        totalDespesas += val;
        if (l.categoria_id) {
          gastosPorCategoria[l.categoria_id] = (gastosPorCategoria[l.categoria_id] || 0) + val;
          nomesCategorias[l.categoria_id] = l.categoria_nome || 'Sem Categoria';
          iconesCategorias[l.categoria_id] = l.categoria_icone || 'circle';
        }
      }
    });

    let maiorGasto = null;
    let maiorValorGasto = -1;

    Object.entries(gastosPorCategoria).forEach(([id, valor]) => {
      if (valor > maiorValorGasto) {
        maiorValorGasto = valor;
        maiorGasto = {
          nome: nomesCategorias[id],
          valor,
          icone: iconesCategorias[id]
        };
      }
    });

    let maiorReceita = null;
    let maiorValorReceita = -1;

    Object.entries(receitasPorCategoria).forEach(([id, valor]) => {
      if (valor > maiorValorReceita) {
        maiorValorReceita = valor;
        maiorReceita = {
          nome: nomesCategorias[id],
          valor,
          icone: iconesCategorias[id]
        };
      }
    });

    return {
      saldo_periodo: totalReceitas - totalDespesas,
      total_receitas: totalReceitas,
      total_despesas: totalDespesas,
      categoria_mais_gasta: maiorGasto,
      categoria_maior_receita: maiorReceita
    };
  }, [lancamentos]);

  return { data: stats, loading, error: null, refetch };
}

export function useGastosPorCategoria(periodo: string = 'mes-atual') {
  const { data: lancamentos, loading, refetch } = useLancamentos(periodo);

  const gastos = useMemo(() => {
    if (!lancamentos) return [];

    const agrupado: Record<string, GastoPorCategoria> = {};

    lancamentos.filter(l => l.tipo === 'despesa').forEach(l => {
      if (!l.categoria_id) return;

      if (!agrupado[l.categoria_id]) {
        agrupado[l.categoria_id] = {
          categoria_id: l.categoria_id,
          categoria_nome: l.categoria_nome || 'Desconhecida',
          categoria_icone: l.categoria_icone || 'circle',
          total: 0
        };
      }
      agrupado[l.categoria_id].total += Math.abs(Number(l.valor));
    });

    return Object.values(agrupado).sort((a, b) => b.total - a.total);
  }, [lancamentos]);

  return { data: gastos, loading, error: null, refetch };
}

export function useReceitasPorCategoria(periodo: string = 'mes-atual') {
  const { data: lancamentos, loading, refetch } = useLancamentos(periodo);

  const receitas = useMemo(() => {
    if (!lancamentos) return [];

    const agrupado: Record<string, GastoPorCategoria> = {};

    lancamentos.filter(l => l.tipo === 'receita').forEach(l => {
      if (!l.categoria_id) return;

      if (!agrupado[l.categoria_id]) {
        agrupado[l.categoria_id] = {
          categoria_id: l.categoria_id,
          categoria_nome: l.categoria_nome || 'Desconhecida',
          categoria_icone: l.categoria_icone || 'circle',
          total: 0
        };
      }
      agrupado[l.categoria_id].total += Math.abs(Number(l.valor));
    });

    return Object.values(agrupado).sort((a, b) => b.total - a.total);
  }, [lancamentos]);

  return { data: receitas, loading, error: null, refetch };
}

export function useGastosCartoes(periodo: string = 'mes-atual') {
  const { data: lancamentos, loading, refetch } = useLancamentos(periodo);

  const gastos = useMemo(() => {
    if (!lancamentos) return [];

    const agrupado: Record<string, any> = {};

    lancamentos.filter(l => l.tipo === 'despesa' && l.forma_pagamento === 'Cartão' && l.cartao_id).forEach(l => {
      const cartaoId = l.cartao_id!;
      if (!agrupado[cartaoId]) {
        agrupado[cartaoId] = {
          cartao_id: cartaoId,
          total: 0
        };
      }
      agrupado[cartaoId].total += Math.abs(Number(l.valor));
    });

    return Object.values(agrupado);
  }, [lancamentos]);

  return { data: gastos, loading, error: null, refetch };
}

// --- Funções de Escrita (Mutations) ---

// Lançamentos
export async function criarLancamento(dados: NovoLancamento): Promise<Lancamento> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const payload = {
    ...dados,
    user_id: user.id, // Adiciona o ID do usuário
    valor: dados.tipo === 'despesa' ? -Math.abs(dados.valor) : Math.abs(dados.valor),
    status: dados.tipo === 'receita' ? 'pago' :
      (dados.forma_pagamento === 'Cartão' ? 'pendente' : 'pago'),
    competencia: dados.data.substring(0, 7), // YYYY-MM
  };

  const { data, error } = await supabase.from('lancamentos').insert([payload]).select().single();

  if (error) throw error;
  window.dispatchEvent(new CustomEvent('financeDataUpdated'));
  return data;
}

export async function atualizarLancamento(id: string, dados: any) {
  const payload = { ...dados };
  if (dados.valor && dados.tipo) {
    payload.valor = dados.tipo === 'despesa' ? -Math.abs(dados.valor) : Math.abs(dados.valor);
  }

  const { data, error } = await supabase.from('lancamentos').update(payload).eq('id', id).select().single();

  if (error) throw error;
  window.dispatchEvent(new CustomEvent('financeDataUpdated'));
  return data;
}

export async function excluirLancamento(id: string) {
  const { error } = await supabase.from('lancamentos').delete().eq('id', id);
  if (error) throw error;
  window.dispatchEvent(new CustomEvent('financeDataUpdated'));
}

// Categorias
export async function criarCategoria(dados: { nome: string; icone: string; limite_mensal?: number | null }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const payload = { ...dados, user_id: user.id };

  const { data, error } = await supabase.from('categorias').insert([payload]).select().single();
  if (error) throw error;
  window.dispatchEvent(new CustomEvent('financeDataUpdated'));
  return data;
}

export async function atualizarCategoria(id: string, dados: any) {
  const { data, error } = await supabase.from('categorias').update(dados).eq('id', id).select().single();
  if (error) throw error;
  window.dispatchEvent(new CustomEvent('financeDataUpdated'));
  return data;
}

export async function excluirCategoria(id: string) {
  const { error } = await supabase.from('categorias').update({ ativa: false }).eq('id', id);
  if (error) throw error;
  window.dispatchEvent(new CustomEvent('financeDataUpdated'));
}

// Cartões
export async function criarCartao(dados: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const payload = { ...dados, user_id: user.id };

  const { data, error } = await supabase.from('cartoes').insert([payload]).select().single();
  if (error) throw error;
  window.dispatchEvent(new CustomEvent('financeDataUpdated'));
  return data;
}

export async function atualizarCartao(id: string, dados: any) {
  const { data, error } = await supabase.from('cartoes').update(dados).eq('id', id).select().single();
  if (error) throw error;
  window.dispatchEvent(new CustomEvent('financeDataUpdated'));
  return data;
}

export async function excluirCartao(id: string) {
  const { error } = await supabase.from('cartoes').delete().eq('id', id);
  if (error) throw error;
  window.dispatchEvent(new CustomEvent('financeDataUpdated'));
}

// Lançamentos Fixos
export async function criarLancamentoFixo(dados: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const payload = { ...dados, user_id: user.id };

  const { data, error } = await supabase.from('lancamentos_fixos').insert([payload]).select().single();
  if (error) throw error;
  window.dispatchEvent(new CustomEvent('financeDataUpdated'));
  return data;
}

export async function atualizarLancamentoFixo(id: string, dados: any) {
  const { data, error } = await supabase.from('lancamentos_fixos').update(dados).eq('id', id).select().single();
  if (error) throw error;
  window.dispatchEvent(new CustomEvent('financeDataUpdated'));
  return data;
}

export async function excluirLancamentoFixo(id: string) {
  const { error } = await supabase.from('lancamentos_fixos').delete().eq('id', id);
  if (error) throw error;
  window.dispatchEvent(new CustomEvent('financeDataUpdated'));
}

// --- Utils ---

export function formatarMoeda(valor: number): string {
  if (isNaN(valor)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

export function formatarData(data: string): string {
  if (!data) return '';
  const datePart = data.split('T')[0];
  const [ano, mes, dia] = datePart.split('-');
  return `${dia}/${mes}/${ano}`;
}
