import { useState } from 'react';
import { TrendingUp, TrendingDown, Clock, Edit, Trash2, Home, Target } from 'lucide-react';
import { Link } from 'react-router';
import { useDashboardStats, useGastosPorCategoria, useLancamentos, useCategorias, formatarMoeda, formatarData, excluirLancamento } from '@/react-app/hooks/useApi';
import { useValoresVisiveis } from '@/react-app/hooks/useValoresVisiveis';
import Card from '@/react-app/components/Card';
import FilterChips from '@/react-app/components/FilterChips';
import Icon from '@/react-app/components/Icon';
import EditLancamentoModal from '@/react-app/components/EditLancamentoModal';
import UserMenu from '@/react-app/components/UserMenu';
import ConfirmModal from '@/react-app/components/ConfirmModal';

export default function Dashboard() {
  const [periodo, setPeriodo] = useState('mes-atual');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLancamento, setEditingLancamento] = useState<any>(null);
  const [lancamentosExpandidos, setLancamentosExpandidos] = useState(false);
  const { valoresVisiveis } = useValoresVisiveis();

  // Confirmação de exclusão
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [lancamentoToDelete, setLancamentoToDelete] = useState<any>(null);

  const { data: stats, loading: loadingStats, refetch: refetchStats } = useDashboardStats(periodo);
  const { data: gastosPorCategoria, loading: loadingGastos, refetch: refetchGastos } = useGastosPorCategoria(periodo);
  const { data: lancamentosRecentes, loading: loadingRecentes, refetch: refetchRecentes } = useLancamentos(periodo);
  const { data: categorias } = useCategorias();

  const handleSuccess = () => {
    // Refetch dos dados em vez de recarregar a página
    refetchStats();
    refetchGastos();
    refetchRecentes();
  };

  const handleEditLancamento = (lancamento: any) => {
    setEditingLancamento(lancamento);
    setEditModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!lancamentoToDelete) return;
    try {
      await excluirLancamento(lancamentoToDelete.id);
      // O refetch acontece automaticamente pois os hooks escutam o evento
    } catch (error: any) {
      console.error('Erro ao excluir lançamento:', error);
      alert('Erro ao excluir lançamento: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setConfirmModalOpen(false);
      setLancamentoToDelete(null);
    }
  };

  const handleDeleteClick = (lancamento: any) => {
    setLancamentoToDelete(lancamento);
    setConfirmModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 pb-32">
      {/* Header */}
      <div className="py-3 sm:py-4 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2 rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100">
                <Home className="text-teal-600" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-light text-gray-900">Visão Geral</h1>
              </div>
            </div>

            {/* Botões do usuário integrados no header */}
            <UserMenu />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-1 sm:py-2">
        {/* Filtros */}
        <FilterChips selectedPeriodo={periodo} onPeriodoChange={setPeriodo} />

        {/* Card combinado de Receitas e Despesas */}
        <Card className="mb-6 bg-white/90 backdrop-blur-sm animate-slide-up">
          <div className="grid grid-cols-2 divide-x divide-gray-200/50">
            {/* Receitas */}
            <Link to="/historico?filtro=receitas" className="flex items-center justify-center py-1 px-2 sm:px-3 hover:bg-gray-50/50 transition-colors rounded-l-3xl pr-4 sm:pr-6">
              <div className="flex flex-col items-center text-center gap-0.5">
                <div className="p-2 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100">
                  <TrendingUp className="text-teal-500" size={16} />
                </div>
                <div>
                  <p className="text-xs font-light text-gray-600 mb-0.5">Receitas</p>
                  <p className="text-lg sm:text-xl font-semibold text-teal-500">
                    {loadingStats ? '...' : valoresVisiveis ? formatarMoeda(stats?.total_receitas || 0) : '••••••'}
                  </p>
                </div>
              </div>
            </Link>

            {/* Despesas */}
            <Link to="/historico?filtro=despesas" className="flex items-center justify-center py-1 px-2 sm:px-3 hover:bg-gray-50/50 transition-colors rounded-r-3xl pl-4 sm:pl-6">
              <div className="flex flex-col items-center text-center gap-0.5">
                <div className="p-2 rounded-full bg-gradient-to-br from-orange-100 to-red-100">
                  <TrendingDown className="text-orange-500" size={16} />
                </div>
                <div>
                  <p className="text-xs font-light text-gray-600 mb-0.5">Despesas</p>
                  <p className="text-lg sm:text-xl font-semibold text-orange-500">
                    {loadingStats ? '...' : valoresVisiveis ? formatarMoeda(stats?.total_despesas || 0) : '••••••'}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </Card>

        {/* Últimos lançamentos e Gastos por categoria lado a lado no desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 animate-slide-up-delay-1">
          {/* Card Últimos Lançamentos */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-2xl shadow-gray-400/30 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200">
                  <Clock className="text-gray-600" size={20} />
                </div>
                <h3 className="text-lg font-light text-gray-900">Últimos Lançamentos</h3>
              </div>
              {lancamentosRecentes && lancamentosRecentes.length > 3 && (
                <button
                  onClick={() => setLancamentosExpandidos(!lancamentosExpandidos)}
                  className="text-sm text-teal-500 hover:text-teal-600 font-medium transition-colors flex flex-col items-center leading-tight"
                >
                  {lancamentosExpandidos ? (
                    <>
                      <span>Ver</span>
                      <span>menos</span>
                    </>
                  ) : (
                    <>
                      <span>Ver</span>
                      <span>mais</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {loadingRecentes ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
              </div>
            ) : lancamentosRecentes && lancamentosRecentes.length > 0 ? (
              <div className="space-y-2">
                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${lancamentosExpandidos ? 'max-h-[2000px] opacity-100' : 'max-h-[300px] opacity-100'
                  }`}>
                  {lancamentosRecentes.slice(0, 3).map((lancamento) => (
                    <div key={lancamento.id} className="group relative flex items-center p-3 bg-gray-50/70 rounded-xl hover:bg-gray-100/70 transition-all duration-200">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                          <Icon
                            name={lancamento.categoria_icone || 'circle'}
                            size={16}
                            className="text-gray-600"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">{lancamento.descricao}</p>
                              <p className="text-xs text-gray-500 font-light">
                                {formatarData(lancamento.data)} • {lancamento.categoria_nome || 'Sem categoria'} • {lancamento.forma_pagamento}
                              </p>
                            </div>
                            <div className="ml-4 flex items-center gap-2">
                              <p className={`text-sm font-medium ${lancamento.tipo === 'receita' ? 'text-teal-500' : 'text-orange-500'
                                }`}>
                                {valoresVisiveis ? (
                                  <>
                                    {lancamento.tipo === 'receita' ? '+' : ''}
                                    {formatarMoeda(Math.abs(lancamento.valor))}
                                  </>
                                ) : '••••'}
                              </p>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditLancamento(lancamento);
                                  }}
                                  className="p-1 text-gray-400 hover:text-teal-500 hover:bg-teal-50 rounded transition-colors"
                                  title="Editar"
                                >
                                  <Edit size={12} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(lancamento);
                                  }}
                                  className="p-1 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {lancamentosExpandidos && lancamentosRecentes.length > 3 && (
                  <div className={`space-y-2 transition-all duration-500 ease-in-out transform ${lancamentosExpandidos ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                    }`}>
                    {lancamentosRecentes.slice(3).map((lancamento) => (
                      <div key={lancamento.id} className="group relative flex items-center p-3 bg-gray-50/70 rounded-xl hover:bg-gray-100/70 transition-all duration-200">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                            <Icon
                              name={lancamento.categoria_icone || 'circle'}
                              size={16}
                              className="text-gray-600"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0 pr-2">
                                <p className="font-medium text-gray-900 text-sm truncate">{lancamento.descricao}</p>
                                <p className="text-xs text-gray-500 font-light">
                                  {formatarData(lancamento.data)} • {lancamento.categoria_nome || 'Sem categoria'} • {lancamento.forma_pagamento}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditLancamento(lancamento);
                                    }}
                                    className="p-1 text-gray-400 hover:text-teal-500 hover:bg-teal-50 rounded transition-colors"
                                    title="Editar"
                                  >
                                    <Edit size={12} />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteClick(lancamento);
                                    }}
                                    className="p-1 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors"
                                    title="Excluir"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                                <p className={`text-sm font-medium text-right min-w-20 ${lancamento.tipo === 'receita' ? 'text-teal-500' : 'text-orange-500'
                                  }`}>
                                  {valoresVisiveis ? (
                                    <>
                                      {lancamento.tipo === 'receita' ? '+' : ''}
                                      {formatarMoeda(Math.abs(lancamento.valor))}
                                    </>
                                  ) : '••••'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="p-3 rounded-2xl bg-gray-100/50 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                  <Clock className="text-gray-400" size={20} />
                </div>
                <p className="text-gray-500 font-light text-sm">Nenhum lançamento recente</p>
              </div>
            )}
          </Card>

          {/* Card Limite de gastos por categoria */}
          <Link to="/configuracoes">
            <Card className="bg-white/90 backdrop-blur-sm shadow-2xl shadow-gray-400/30 animate-slide-up-delay-2 hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer transform">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200">
                  <Target className="text-gray-600" size={20} />
                </div>
                <h3 className="text-lg font-light text-gray-900">Limite de gastos por categoria</h3>
              </div>
              {loadingGastos ? (
                <div className="flex items-center justify-center h-[200px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
                </div>
              ) : (categorias?.filter(c => c.limite_mensal && c.limite_mensal > 0).length || 0) > 0 ? (
                <div className="space-y-6">
                  {categorias?.filter(c => c.limite_mensal && c.limite_mensal > 0).map((categoria) => {
                    const gastoItem = gastosPorCategoria?.find(g => g.categoria_id === categoria.id);
                    const totalGasto = gastoItem?.total || 0;
                    const limite = categoria.limite_mensal || 0;
                    const percentual = (totalGasto / limite) * 100;
                    const atingido = totalGasto >= limite;
                    const restante = Math.max(0, limite - totalGasto);

                    return (
                      <div key={categoria.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="p-2.5 rounded-xl bg-gray-50">
                              <Icon name={categoria.icone} size={16} className="text-gray-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 truncate text-sm">
                                {categoria.nome}
                              </p>
                              <div className="flex items-center gap-2">
                                <p className="text-xs text-gray-500 font-light">
                                  {valoresVisiveis ? formatarMoeda(totalGasto) : '••••••'}
                                </p>
                                <span className="text-[10px] text-gray-400">
                                  / {formatarMoeda(limite)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-[10px] font-medium ${atingido ? 'text-red-500' : 'text-teal-600'}`}>
                              {atingido ? 'Limite atingido' : `Restante: ${valoresVisiveis ? formatarMoeda(restante) : '••••'}`}
                            </p>
                          </div>
                        </div>

                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-700 rounded-full ${atingido ? 'bg-red-500' : percentual > 80 ? 'bg-orange-400' : 'bg-teal-400'
                              }`}
                            style={{ width: `${Math.min(percentual, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="p-4 rounded-2xl bg-gray-100/50 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Target className="text-gray-400" size={24} />
                  </div>
                  <p className="text-gray-900 font-medium mb-1">Criar limite de gastos</p>
                  <p className="text-gray-500 font-light text-xs px-6">Você ainda não definiu limites para suas categorias.</p>
                </div>
              )}
            </Card>
          </Link>
        </div>

        {/* Categoria que mais gastou - clicável */}
        {stats?.categoria_mais_gasta && (
          <Link to="/ranking-categorias">
            <Card className="bg-white/90 backdrop-blur-sm shadow-2xl shadow-gray-400/30 hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer transform animate-slide-up-delay-1 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200">
                  <TrendingDown className="text-gray-600" size={20} />
                </div>
                <h3 className="text-lg font-light text-gray-900">Categoria com maior gasto</h3>
              </div>

              <div className="flex items-center justify-between bg-gray-50/70 p-4 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-white shadow-sm">
                    <Icon name={stats.categoria_mais_gasta.icone || 'award'} size={24} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 leading-tight">
                      {stats.categoria_mais_gasta.nome}
                    </p>
                    <p className="text-base font-medium text-orange-500">
                      {valoresVisiveis ? formatarMoeda(stats.categoria_mais_gasta.valor) : '••••••'}
                    </p>
                  </div>
                </div>
                <div className="text-teal-500 font-medium text-sm">
                  Ver ranking completo →
                </div>
              </div>
            </Card>
          </Link>
        )}
      </div>

      {/* Modal de edição */}
      <EditLancamentoModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingLancamento(null);
        }}
        onSuccess={handleSuccess}
        lancamento={editingLancamento}
      />

      {/* Modal de confirmação de exclusão */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setLancamentoToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Excluir Lançamento"
        message={`Tem certeza que deseja excluir o lançamento "${lancamentoToDelete?.descricao}"?`}
        confirmText="Excluir"
        isDestructive
      />
    </div>
  );
}
