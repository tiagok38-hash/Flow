import { useState, useMemo, useEffect } from 'react';
import { History, Edit, Trash2, Filter, Search } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { useLancamentos, formatarMoeda, formatarData, excluirLancamento } from '@/react-app/hooks/useApi';
import Card from '@/react-app/components/Card';
import FilterChips from '@/react-app/components/FilterChips';
import Icon from '@/react-app/components/Icon';
import EditLancamentoModal from '@/react-app/components/EditLancamentoModal';
import ConfirmModal from '@/react-app/components/ConfirmModal';

export default function Historico() {
  const [searchParams] = useSearchParams();
  const [periodo, setPeriodo] = useState('mes-atual');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLancamento, setEditingLancamento] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'despesas' | 'receitas'>('todos');

  // Confirmação de exclusão
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [lancamentoToDelete, setLancamentoToDelete] = useState<any>(null);

  const { data: lancamentos, loading } = useLancamentos(periodo);

  // Verificar filtro inicial da URL
  useEffect(() => {
    const filtroUrl = searchParams.get('filtro');
    if (filtroUrl === 'despesas') {
      setFiltroTipo('despesas');
    } else if (filtroUrl === 'receitas') {
      setFiltroTipo('receitas');
    }
  }, [searchParams]);

  // Para busca - buscar em todos os lançamentos independente do período
  const { data: todosLancamentos } = useLancamentos('ano');

  // Filtrar lançamentos pela busca e tipo
  const lancamentosFiltrados = useMemo(() => {
    // Se há busca, usar todos os lançamentos, senão usar os do período selecionado
    let resultado = searchTerm.trim() ? (todosLancamentos || []) : (lancamentos || []);

    // Filtrar por tipo
    if (filtroTipo === 'despesas') {
      resultado = resultado.filter(lancamento => lancamento.tipo === 'despesa');
    } else if (filtroTipo === 'receitas') {
      resultado = resultado.filter(lancamento => lancamento.tipo === 'receita');
    }

    // Filtrar por busca
    if (searchTerm.trim()) {
      const termoBusca = searchTerm.toLowerCase();
      resultado = resultado.filter(lancamento =>
        lancamento.descricao?.toLowerCase().includes(termoBusca) ||
        lancamento.categoria_nome?.toLowerCase().includes(termoBusca) ||
        lancamento.forma_pagamento?.toLowerCase().includes(termoBusca)
      );
    }

    return resultado;
  }, [lancamentos, todosLancamentos, searchTerm, filtroTipo]);

  const handleEditLancamento = (lancamento: any) => {
    setEditingLancamento(lancamento);
    setEditModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!lancamentoToDelete) return;
    try {
      await excluirLancamento(lancamentoToDelete.id);
      // Não precisa de reload pois o hook useLancamentos escuta alterações
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

  const handleSuccess = () => {
    window.location.reload();
  };

  const getStatusColor = (status: string) => {
    return status === 'pago' ? 'bg-teal-100 text-teal-700' : 'bg-orange-100 text-orange-700';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 pb-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 sm:py-4">
        <div className="py-3 sm:py-3 mb-3 sm:mb-4">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100">
              <History className="text-teal-600" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-light text-gray-900">Histórico de Lançamentos</h1>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <FilterChips selectedPeriodo={periodo} onPeriodoChange={setPeriodo} />

        {/* Filtros de tipo e busca */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
          {/* Filtro de tipo */}
          <div className="flex bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-1.5 shadow-inner w-full md:max-w-md">
            <button
              onClick={() => setFiltroTipo('todos')}
              className={`flex-1 py-2 px-4 rounded-xl font-light transition-all duration-300 text-sm ${filtroTipo === 'todos'
                ? 'bg-white text-gray-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroTipo('despesas')}
              className={`flex-1 py-2 px-4 rounded-xl font-light transition-all duration-300 text-sm ${filtroTipo === 'despesas'
                ? 'bg-gradient-to-r from-orange-400 to-red-400 text-white shadow-lg shadow-orange-500/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
            >
              Despesas
            </button>
            <button
              onClick={() => setFiltroTipo('receitas')}
              className={`flex-1 py-2 px-4 rounded-xl font-light transition-all duration-300 text-sm ${filtroTipo === 'receitas'
                ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-white shadow-lg shadow-teal-500/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
            >
              Receitas
            </button>
          </div>

          {/* Barra de busca */}
          <div className="relative w-full md:flex-1 md:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar lançamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-300/70 rounded-2xl focus:ring-2 focus:ring-teal-400 focus:border-transparent text-sm font-light placeholder-gray-400 shadow-sm"
            />
          </div>
        </div>

        {/* Lista de lançamentos */}
        <Card className="animate-slide-up">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200">
              <Filter className="text-gray-600" size={20} />
            </div>
            <h3 className="text-xl font-light text-gray-900">
              {filtroTipo === 'despesas' ? 'Despesas' :
                filtroTipo === 'receitas' ? 'Receitas' :
                  'Lançamentos do período'}
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
            </div>
          ) : lancamentosFiltrados && lancamentosFiltrados.length > 0 ? (
            <div className="space-y-3">
              {lancamentosFiltrados.map((lancamento, index) => (
                <div
                  key={lancamento.id}
                  className="group p-3 sm:p-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg shadow-gray-400/30 hover:shadow-xl hover:shadow-gray-500/40 transition-all duration-200 hover:scale-[1.01] animate-slide-up"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-center gap-3">
                    {/* Ícone da categoria */}
                    <div className="p-2 bg-gray-50 rounded-xl flex-shrink-0">
                      <Icon
                        name={lancamento.categoria_icone || 'circle'}
                        size={18}
                        className="text-gray-600"
                      />
                    </div>

                    {/* Conteúdo principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm truncate">
                            {lancamento.descricao}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-light ${getStatusColor(lancamento.status)}`}>
                              {lancamento.status}
                            </span>
                            <span className="text-xs text-gray-400">
                              {(() => {
                                if (!lancamento.created_at) return '';
                                const date = new Date(lancamento.created_at);
                                return isNaN(date.getTime()) ? '' : date.toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  timeZone: 'America/Sao_Paulo'
                                });
                              })()}
                            </span>
                          </div>
                        </div>

                        {/* Valor destacado */}
                        <div className="text-right flex-shrink-0">
                          <p className={`text-lg font-semibold ${lancamento.tipo === 'receita' ? 'text-teal-500' : 'text-orange-500'}`}>
                            {lancamento.tipo === 'receita' ? '+' : ''}
                            {formatarMoeda(Math.abs(lancamento.valor))}
                          </p>
                        </div>
                      </div>

                      {/* Linha 2: Detalhes e Ações */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-light">
                          <span className="truncate">{lancamento.categoria_nome || 'Sem categoria'}</span>
                          <span className="text-gray-300">•</span>
                          <span>{formatarData(lancamento.data)}</span>
                          <span className="text-gray-300">•</span>
                          <span>{lancamento.forma_pagamento}</span>
                        </div>

                        {/* Ações */}
                        <div className="flex gap-1 opacity-70 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditLancamento(lancamento);
                            }}
                            className="p-1.5 text-gray-400 hover:text-teal-500 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(lancamento);
                            }}
                            className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <History className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg sm:text-xl font-light text-gray-900 mb-2">
                {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum lançamento encontrado'}
              </h3>
              <p className="text-gray-500 font-light text-sm sm:text-base">
                {searchTerm
                  ? `Nenhum lançamento corresponde à busca "${searchTerm}"`
                  : 'Nenhuma transação foi encontrada no período selecionado'
                }
              </p>
            </div>
          )}
        </Card>
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
