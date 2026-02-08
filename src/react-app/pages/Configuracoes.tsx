import { useState } from 'react';
import { Settings, Plus, Edit, Trash2, Target, Calendar } from 'lucide-react';
import {
  useCategorias,
  useLancamentosFixos,
  useGastosPorCategoria,
  excluirCategoria,
  excluirLancamentoFixo,
  formatarMoeda
} from '@/react-app/hooks/useApi';
import Card from '@/react-app/components/Card';
import Button from '@/react-app/components/Button';
import Icon from '@/react-app/components/Icon';
import CategoriaModal from '@/react-app/components/CategoriaModal';
import LimiteModal from '@/react-app/components/LimiteModal';
import LancamentoFixoModal from '@/react-app/components/LancamentoFixoModal';

export default function Configuracoes() {
  const { data: categorias, loading: loadingCategorias, refetch: refetchCategorias } = useCategorias();
  const { data: lancamentosFixos, loading: loadingFixos, refetch: refetchFixos } = useLancamentosFixos();
  const { data: gastosPorCategoria } = useGastosPorCategoria();

  const [categoriaModalOpen, setCategoriaModalOpen] = useState(false);
  const [limiteModalOpen, setLimiteModalOpen] = useState(false);
  const [lancamentoFixoModalOpen, setLancamentoFixoModalOpen] = useState(false);

  const [editingCategoria, setEditingCategoria] = useState<any>(null);
  const [editingLancamentoFixo, setEditingLancamentoFixo] = useState<any>(null);

  const [categoriasExpanded, setCategoriasExpanded] = useState(false);
  const [gastosFixosExpanded, setGastosFixosExpanded] = useState(false);
  const [limitesExpanded, setLimitesExpanded] = useState(false);

  const handleEditCategoria = (categoria: any) => {
    setEditingCategoria(categoria);
    setCategoriaModalOpen(true);
  };

  const handleDeleteCategoria = async (categoriaId: string) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await excluirCategoria(categoriaId);
        refetchCategorias();
      } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        alert('Erro ao excluir categoria');
      }
    }
  };

  const handleEditLancamentoFixo = (lancamentoFixo: any) => {
    setEditingLancamentoFixo(lancamentoFixo);
    setLancamentoFixoModalOpen(true);
  };

  const handleDeleteLancamentoFixo = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lançamento fixo?')) {
      try {
        await excluirLancamentoFixo(id);
        refetchFixos();
      } catch (error) {
        console.error('Erro ao excluir lançamento fixo:', error);
        alert('Erro ao excluir lançamento fixo');
      }
    }
  };

  const handleLancamentoFixoSuccess = () => {
    refetchFixos();
    setLancamentoFixoModalOpen(false);
    setEditingLancamentoFixo(null);
  };

  const handleSuccess = () => {
    refetchCategorias();
    // Se houver outros updates necessários, adicione aqui
  };

  const getPeriodicidadeTexto = (lancamento: any) => {
    switch (lancamento.periodicidade) {
      case 'diario':
        return 'Diário';
      case 'semanal':
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return `Semanal (${diasSemana[lancamento.dia_semana]})`;
      case 'quinzenal':
        return `Quinzenal (dias ${lancamento.dia_mes_1} e ${lancamento.dia_mes_2})`;
      case 'mensal':
        return `Mensal (dia ${lancamento.dia_mes_1})`;
      default:
        return 'Não definido';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 pb-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="px-4 sm:px-6 py-3 mb-4">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100">
              <Settings className="text-teal-600" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-light text-gray-900">Configurações</h1>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 animate-slide-up">
          {/* Gastos/Receitas Fixas */}
          <Card className="animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200">
                  <Calendar className="text-gray-600" size={20} />
                </div>
                <h3 className="text-xl font-light text-gray-900">Gastos/Receitas Fixas</h3>
              </div>
              <Button
                onClick={() => {
                  setEditingLancamentoFixo(null);
                  setLancamentoFixoModalOpen(true);
                }}
                size="sm"
                variant="primary"
              >
                <Plus size={16} className="mr-2" />
                Novo
              </Button>
            </div>

            {loadingFixos ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {lancamentosFixos && lancamentosFixos.length > 0 ? (
                  (gastosFixosExpanded ? lancamentosFixos : lancamentosFixos.slice(0, 2)).map((lancamento) => (
                    <div key={lancamento.id} className="group flex items-center justify-between p-3 bg-gray-50/70 rounded-2xl hover:bg-gray-100/70 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm">
                          <Icon name={lancamento.icone} size={16} className={lancamento.tipo === 'receita' ? 'text-teal-500' : 'text-orange-500'} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{lancamento.nome}</p>
                          <p className="text-xs text-gray-500 font-light">
                            {getPeriodicidadeTexto(lancamento)} • {formatarMoeda(lancamento.valor)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditLancamentoFixo(lancamento)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteLancamentoFixo(lancamento.id)}
                          className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="p-3 rounded-2xl bg-gray-100/50 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                      <Calendar className="text-gray-400" size={20} />
                    </div>
                    <p className="text-gray-500 font-light text-sm">Nenhum lançamento fixo configurado</p>
                  </div>
                )}

                {/* Botão para expandir/contrair se houver mais de 2 lançamentos fixos */}
                {lancamentosFixos && lancamentosFixos.length > 2 && (
                  <button
                    onClick={() => setGastosFixosExpanded(!gastosFixosExpanded)}
                    className="w-full p-2 text-center text-teal-600 hover:text-teal-700 font-medium text-sm hover:bg-teal-50 rounded-2xl transition-all duration-200"
                  >
                    {gastosFixosExpanded
                      ? `Mostrar menos`
                      : `Ver mais ${lancamentosFixos.length - 2} lançamentos`
                    }
                  </button>
                )}
              </div>
            )}
          </Card>

          {/* Gerenciar Categorias */}
          <Card className="animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200">
                  <Settings className="text-gray-600" size={20} />
                </div>
                <h3 className="text-xl font-light text-gray-900">Categorias</h3>
              </div>
              <Button
                onClick={() => {
                  setEditingCategoria(null);
                  setCategoriaModalOpen(true);
                }}
                size="sm"
                variant="primary"
              >
                <Plus size={16} className="mr-2" />
                Nova Categoria
              </Button>
            </div>

            {loadingCategorias ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {(categoriasExpanded ? categorias : categorias?.slice(0, 2))?.map((categoria) => (
                  <div key={categoria.id} className="group flex items-center justify-between p-3 bg-gray-50/70 rounded-2xl hover:bg-gray-100/70 transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-white rounded-xl shadow-sm">
                        <Icon name={categoria.icone} size={16} className="text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{categoria.nome}</p>
                        {categoria.limite_mensal && (
                          <p className="text-xs text-teal-500 font-light">
                            Limite: R$ {categoria.limite_mensal.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditCategoria(categoria)}
                        className="p-1.5 text-gray-400 hover:text-teal-500 hover:bg-teal-50 rounded-xl transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategoria(categoria.id)}
                        className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Botão para expandir/contrair se houver mais de 2 categorias */}
                {categorias && categorias.length > 2 && (
                  <button
                    onClick={() => setCategoriasExpanded(!categoriasExpanded)}
                    className="w-full p-2 text-center text-teal-600 hover:text-teal-700 font-medium text-sm hover:bg-teal-50 rounded-2xl transition-all duration-200"
                  >
                    {categoriasExpanded
                      ? `Mostrar menos`
                      : `Ver mais ${categorias.length - 2} categorias`
                    }
                  </button>
                )}
              </div>
            )}
          </Card>

          {/* Configurar Limites */}
          <Card className="animate-slide-up-delay-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200">
                  <Target className="text-gray-600" size={20} />
                </div>
                <h3 className="text-xl font-light text-gray-900">Limites de Gastos</h3>
              </div>
              <Button
                onClick={() => setLimiteModalOpen(true)}
                size="sm"
                variant="secondary"
                className="border-gray-200"
              >
                <Target size={16} className="mr-2" />
                Configurar Limites
              </Button>
            </div>

            <div className="space-y-3">
              {(categorias?.filter(c => c.limite_mensal)?.length || 0) > 0 ? (
                (limitesExpanded ? categorias?.filter(c => c.limite_mensal) : categorias?.filter(c => c.limite_mensal)?.slice(0, 2))?.map((categoria) => {
                  const gastoAtual = gastosPorCategoria?.find(g => g.categoria_id === categoria.id)?.total || 0;
                  const limite = categoria.limite_mensal || 0;
                  const restante = limite - gastoAtual;
                  const percentual = limite > 0 ? (gastoAtual / limite) * 100 : 0;
                  const atingido = restante <= 0;

                  return (
                    <div key={categoria.id} className="group flex items-center justify-between p-3 bg-gray-50/70 rounded-2xl hover:bg-gray-100/70 transition-all duration-200">
                      <div className="flex items-center gap-3 w-full">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm">
                          <Icon name={categoria.icone} size={16} className="text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <p className="font-medium text-gray-900 text-sm">{categoria.nome}</p>
                            {atingido && (
                              <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full border border-red-100 animate-pulse">
                                ⚠️ Cuidado: limite atingido!
                              </span>
                            )}
                          </div>

                          <div className="space-y-1">
                            {/* Barra de progresso visual */}
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${atingido ? 'bg-red-500' : percentual > 80 ? 'bg-orange-400' : 'bg-teal-400'}`}
                                style={{ width: `${Math.min(percentual, 100)}%` }}
                              />
                            </div>

                            <div className="flex justify-between items-center text-xs">
                              <span className={atingido ? "text-red-600 font-bold" : "text-gray-600"}>
                                Gasto: {formatarMoeda(gastoAtual)}
                              </span>

                              {!atingido ? (
                                <span className="text-teal-600 font-medium">
                                  Restante: {formatarMoeda(restante)}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-[10px]">
                                  Limite: {formatarMoeda(limite)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <div className="p-3 rounded-2xl bg-gray-100/50 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <Target className="text-gray-400" size={20} />
                  </div>
                  <p className="text-gray-500 font-light text-sm">Nenhum limite configurado</p>
                </div>
              )}

              {/* Botão para expandir/contrair se houver mais de 2 limites */}
              {(categorias?.filter(c => c.limite_mensal)?.length || 0) > 2 && (
                <button
                  onClick={() => setLimitesExpanded(!limitesExpanded)}
                  className="w-full p-2 text-center text-teal-600 hover:text-teal-700 font-medium text-sm hover:bg-teal-50 rounded-2xl transition-all duration-200"
                >
                  {limitesExpanded
                    ? `Mostrar menos`
                    : `Ver mais ${((categorias?.filter(c => c.limite_mensal)?.length || 0) - 2)} limites`
                  }
                </button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <CategoriaModal
        isOpen={categoriaModalOpen}
        onClose={() => {
          setCategoriaModalOpen(false);
          setEditingCategoria(null);
        }}
        onSuccess={handleSuccess}
        categoria={editingCategoria}
      />

      <LimiteModal
        isOpen={limiteModalOpen}
        onClose={() => setLimiteModalOpen(false)}
        onSuccess={handleSuccess}
      />

      <LancamentoFixoModal
        isOpen={lancamentoFixoModalOpen}
        onClose={() => {
          setLancamentoFixoModalOpen(false);
          setEditingLancamentoFixo(null);
        }}
        onSuccess={handleLancamentoFixoSuccess}
        lancamentoFixo={editingLancamentoFixo}
      />
    </div>
  );
}
