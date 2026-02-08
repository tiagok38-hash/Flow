import { useState } from 'react';
import { CreditCard, Plus, Calendar, DollarSign, AlertTriangle, Edit, Trash2, Trophy } from 'lucide-react';
import { useCartoes, useGastosCartoes, formatarMoeda, excluirCartao } from '@/react-app/hooks/useApi';
import Card from '@/react-app/components/Card';
import Button from '@/react-app/components/Button';
import CartaoModal from '@/react-app/components/CartaoModal';
import EditCartaoModal from '@/react-app/components/EditCartaoModal';

export default function Cartoes() {
  const [cartaoModalOpen, setCartaoModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCartao, setEditingCartao] = useState<any>(null);
  const [rankingExpanded, setRankingExpanded] = useState(false);

  const {
    data: cartoes,
    loading: loadingCartoes
  } = useCartoes();
  const {
    data: gastosCartoes,
    loading: loadingGastos
  } = useGastosCartoes();

  const handleSuccess = () => {
    // Forçar refresh dos dados sem recarregar a página inteira
    window.dispatchEvent(new CustomEvent('financeDataUpdated'));
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleEditCartao = (cartao: any) => {
    setEditingCartao(cartao);
    setEditModalOpen(true);
  };

  const handleDeleteCartao = async (cartaoId: string) => {
    try {
      await excluirCartao(cartaoId);

      // Forçar refresh após um pequeno delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Erro ao excluir cartão:', error);
      alert('Erro ao excluir cartão. Tente novamente.');
    }
  };





  const getGastoCartao = (cartaoId: string) => {
    return gastosCartoes?.find(g => g.cartao_id === cartaoId)?.total || 0;
  };

  const getBandeira = (cartao: any) => {
    // Priorizar bandeira cadastrada no banco
    if (cartao.bandeira && typeof cartao.bandeira === 'string' && cartao.bandeira.trim() !== '') {
      return cartao.bandeira.trim();
    }

    // Fallback: tentar detectar pela nome (compatibilidade)
    const nome = cartao.nome ? cartao.nome.toLowerCase() : '';

    if (nome.includes('visa')) return 'visa';
    if (nome.includes('master') || nome.includes('mastercard')) return 'mastercard';
    if (nome.includes('elo')) return 'elo';
    if (nome.includes('amex') || nome.includes('american')) return 'amex';
    if (nome.includes('hipercard')) return 'hipercard';
    if (nome.includes('nubank')) return 'mastercard';
    if (nome.includes('inter')) return 'mastercard';
    if (nome.includes('itau') || nome.includes('itaú')) return 'visa';

    return null;
  };

  const LogoBandeira = ({ bandeira }: { bandeira: string | null }) => {
    if (!bandeira || typeof bandeira !== 'string' || bandeira.trim() === '') {
      return null;
    }

    const bandeiraLimpa = bandeira.trim().toLowerCase();

    // Estilo base otimizado para iPhone
    const baseStyle = "bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1.5 shadow-lg min-w-0 flex-shrink-0 border border-gray-100";

    if (bandeiraLimpa === 'visa') {
      return (
        <div className={baseStyle}>
          <span className="text-blue-600 font-bold text-xs tracking-wider whitespace-nowrap">VISA</span>
        </div>
      );
    }

    if (bandeiraLimpa === 'mastercard') {
      return (
        <div className={`${baseStyle} flex items-center px-1.5`}>
          <div className="w-3.5 h-3.5 bg-red-500 rounded-full flex-shrink-0"></div>
          <div className="w-3.5 h-3.5 bg-yellow-400 rounded-full -ml-2 flex-shrink-0"></div>
        </div>
      );
    }

    if (bandeiraLimpa === 'elo') {
      return (
        <div className={baseStyle}>
          <span className="text-red-600 font-bold text-xs tracking-wider whitespace-nowrap">ELO</span>
        </div>
      );
    }

    if (bandeiraLimpa === 'amex') {
      return (
        <div className={baseStyle}>
          <span className="text-blue-800 font-bold text-xs tracking-wider whitespace-nowrap">AMEX</span>
        </div>
      );
    }

    if (bandeiraLimpa === 'hipercard') {
      return (
        <div className={baseStyle}>
          <span className="text-red-700 font-bold text-xs whitespace-nowrap">HIPER</span>
        </div>
      );
    }

    return (
      <div className={baseStyle}>
        <span className="text-gray-600 font-bold text-xs uppercase whitespace-nowrap">{bandeiraLimpa}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-50 pb-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-4 px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100">
                <CreditCard className="text-teal-600" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-light text-gray-900">Cartões de Crédito</h1>
              </div>
            </div>

            <Button onClick={() => setCartaoModalOpen(true)} className="bg-gradient-to-r from-teal-400 to-cyan-400 hover:from-teal-500 hover:to-cyan-500 text-white shadow-lg shadow-teal-500/25">
              <Plus size={18} className="mr-2" />
              Novo Cartão
            </Button>
          </div>
        </div>

        {/* Ranking de gastos por cartão */}
        {cartoes && cartoes.length > 0 && (
          <Card className="mb-6 bg-white/90 backdrop-blur-sm shadow-2xl shadow-gray-400/30 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
                <Trophy className="text-amber-600" size={18} />
              </div>
              <h3 className="text-lg font-light text-gray-900">Ranking de Gastos</h3>
            </div>

            {loadingGastos ? (
              <div className="flex items-center justify-center h-20">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-400"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Cartões com gastos ordenados por valor */}
                {cartoes
                  .map(cartao => ({
                    ...cartao,
                    gasto: getGastoCartao(cartao.id)
                  }))
                  .filter(cartao => cartao.gasto > 0)
                  .sort((a, b) => b.gasto - a.gasto)
                  .slice(0, rankingExpanded ? undefined : 3)
                  .map((cartao, index) => {
                    const posicao = index + 1;
                    const getMedalColor = (pos: number) => {
                      switch (pos) {
                        case 1: return 'text-yellow-500';
                        case 2: return 'text-gray-400';
                        case 3: return 'text-amber-600';
                        default: return 'text-gray-300';
                      }
                    };

                    const getMedalBg = (pos: number) => {
                      switch (pos) {
                        case 1: return 'bg-yellow-100 border-yellow-200';
                        case 2: return 'bg-gray-100 border-gray-200';
                        case 3: return 'bg-orange-50 border-orange-200';
                        default: return 'bg-gray-50 border-gray-100';
                      }
                    };

                    return (
                      <div key={cartao.id} className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${posicao <= 3 ? 'bg-white border-l-4 shadow-sm' : 'bg-gray-50/70'
                        } ${posicao === 1 ? 'border-yellow-400' :
                          posicao === 2 ? 'border-gray-400' :
                            posicao === 3 ? 'border-amber-500' : 'border-transparent'
                        }`}>
                        <div className="flex items-center gap-3 flex-1">
                          {/* Posição */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${getMedalBg(posicao)}`}>
                            {posicao <= 3 ? (
                              <Trophy size={14} className={getMedalColor(posicao)} />
                            ) : (
                              <span className="text-xs font-bold text-gray-500">{posicao}</span>
                            )}
                          </div>

                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{cartao.nome}</p>
                            {cartao.final4 && (
                              <p className="text-xs text-gray-500 font-light">•••• {cartao.final4}</p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className={`text-sm font-bold ${posicao === 1 ? 'text-yellow-600 font-extrabold text-base' : 'text-gray-700'}`}>
                            {formatarMoeda(cartao.gasto)}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                {/* Botão para expandir/contrair se houver mais de 3 cartões com gastos */}
                {cartoes.filter(cartao => getGastoCartao(cartao.id) > 0).length > 3 && (
                  <button
                    onClick={() => setRankingExpanded(!rankingExpanded)}
                    className="w-full p-2 text-center text-teal-600 hover:text-teal-700 font-medium text-sm hover:bg-teal-50 rounded-xl transition-all duration-200"
                  >
                    {rankingExpanded
                      ? 'Mostrar menos'
                      : `Ver mais ${cartoes.filter(cartao => getGastoCartao(cartao.id) > 0).length - 3} cartões`
                    }
                  </button>
                )}

                {/* Mensagem quando não há gastos */}
                {cartoes.filter(cartao => getGastoCartao(cartao.id) > 0).length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-gray-400 text-sm font-light">Nenhum gasto registrado este mês</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {loadingCartoes || loadingGastos ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
          </div>
        ) : cartoes && cartoes.length > 0 ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 animate-slide-up-delay-1">
            {cartoes.map((cartao, index) => {
              const gastoAtual = getGastoCartao(cartao.id);
              const limite = cartao.limite_mensal || 0;
              const percentualUso = limite > 0 ? gastoAtual / limite * 100 : 0;

              // Mapear cores para gradientes
              const coresCartao = {
                preto: 'from-gray-800 to-black',
                branco: 'from-gray-100 to-white border border-gray-300',
                azul: 'from-blue-400 to-blue-600',
                'azul-claro': 'from-blue-200 to-blue-400',
                amarelo: 'from-yellow-400 to-orange-400',
                verde: 'from-green-400 to-teal-500',
                roxo: 'from-purple-400 to-indigo-500',
                rosa: 'from-pink-400 to-rose-500',
                vermelho: 'from-red-400 to-red-600',
                laranja: 'from-orange-400 to-red-500'
              };

              const corSelecionada = cartao.cor && typeof cartao.cor === 'string' ? cartao.cor.trim() : 'azul';
              const corCartao = coresCartao[corSelecionada as keyof typeof coresCartao] || coresCartao.azul;
              const isCorClara = corSelecionada === 'branco' || corSelecionada === 'amarelo' || corSelecionada === 'azul-claro';

              return (
                <div key={cartao.id} className="animate-slide-up" style={{ animationDelay: `${index * 60}ms` }}>
                  <Card
                    className="relative overflow-hidden bg-white/90 backdrop-blur-sm shadow-xl shadow-gray-400/30 transition-all duration-200 hover:shadow-2xl hover:shadow-gray-500/40 hover:scale-[1.02]"
                    style={{
                      minHeight: '138px',
                    }}
                  >
                    {/* Logo da bandeira - otimizado para iPhone */}
                    <div className="absolute top-3 right-3 z-20">
                      <LogoBandeira bandeira={getBandeira(cartao)} />
                    </div>

                    {/* Alerta de limite */}
                    {percentualUso >= 90 && (
                      <div className="absolute top-2 sm:top-3 right-12 sm:right-16">
                        <div className="p-1 rounded-lg bg-orange-100">
                          <AlertTriangle className="text-orange-500" size={12} />
                        </div>
                      </div>
                    )}



                    {/* Conteúdo do cartão - otimizado para iPhone */}
                    <div className="flex flex-col h-full p-2">
                      {/* Header - responsivo para iPhone */}
                      <div className="flex justify-between items-start mb-1 pt-0.5">
                        <div className="flex items-center gap-2 flex-1">
                          <div className={`p-2 bg-gradient-to-r ${corCartao} rounded-lg shadow-sm`}>
                            <CreditCard className={isCorClara ? "text-gray-700" : "text-white"} size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 text-xs sm:text-sm mb-1 truncate">{cartao.nome}</h3>
                            {cartao.final4 && <p className="text-xs text-gray-500 font-light">•••• {cartao.final4}</p>}
                          </div>
                        </div>

                        <div className="text-center ml-3 sm:ml-6 mr-2 sm:mr-4">
                          <p className="text-xs text-gray-500 font-bold mb-1">Gasto</p>
                          <p className="font-bold text-orange-500 text-lg sm:text-xl leading-tight">
                            {formatarMoeda(gastoAtual)}
                          </p>
                        </div>
                      </div>

                      {/* Barra de progresso do limite */}
                      {limite > 0 && (
                        <div className="mb-1">
                          <div className="w-full bg-gray-100 rounded-full h-1 mb-0.5">
                            <div className={`h-1 rounded-full transition-all duration-500 ${percentualUso >= 90 ? 'bg-gradient-to-r from-orange-400 to-red-400' : percentualUso >= 70 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' : 'bg-gradient-to-r from-teal-400 to-cyan-400'}`} style={{
                              width: `${Math.min(percentualUso, 100)}%`
                            }} />
                          </div>
                          <div className="flex justify-between text-[9px] text-gray-600 font-medium">
                            <span>{percentualUso.toFixed(0)}% usado</span>
                            <span>{formatarMoeda(limite)}</span>
                          </div>
                        </div>
                      )}

                      {/* Informações de datas - compacto para iPhone */}
                      <div className="grid grid-cols-2 gap-2 mb-1">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Calendar className="text-gray-500" size={7} />
                            <span className="text-[8px] sm:text-[9px] text-gray-600 font-medium uppercase tracking-tighter">Fech. Dia {cartao.fechamento_dia}</span>
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <DollarSign className="text-gray-500" size={7} />
                            <span className="text-[8px] sm:text-[9px] text-gray-600 font-medium uppercase tracking-tighter">Venc. Dia {cartao.vencimento_dia}</span>
                          </div>
                        </div>
                      </div>

                      {/* Rodapé com botões de ação */}
                      <div className="mt-auto flex items-center justify-center pt-1 border-t border-gray-100/50">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCartao(cartao);
                            }}
                            className="p-1 px-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider"
                          >
                            <Edit size={11} />
                            Editar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Tem certeza que deseja excluir o cartão ${cartao.nome}?`)) {
                                handleDeleteCartao(cartao.id);
                              }
                            }}
                            className="p-1 px-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-[9px] font-medium uppercase tracking-wider"
                          >
                            <Trash2 size={11} />
                            Excluir
                          </button>
                        </div>

                        {percentualUso >= 90 && (
                          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 bg-orange-50 border border-orange-100 rounded-md">
                            <AlertTriangle className="text-orange-500" size={9} />
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        ) : (
          <Card className="bg-white/70 backdrop-blur-sm shadow-xl shadow-gray-400/30 animate-slide-up-delay-1">
            <div className="text-center py-16">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-100 to-cyan-100 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <CreditCard className="text-teal-600" size={32} />
              </div>
              <h3 className="text-xl font-light text-gray-900 mb-3">
                Nenhum cartão cadastrado
              </h3>
              <p className="text-gray-500 font-light max-w-md mx-auto">
                Cadastre seus cartões de crédito para acompanhar os gastos e datas importantes de forma automatizada.
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Modals */}
      <CartaoModal isOpen={cartaoModalOpen} onClose={() => setCartaoModalOpen(false)} onSuccess={handleSuccess} />

      <EditCartaoModal isOpen={editModalOpen} onClose={() => {
        setEditModalOpen(false);
        setEditingCartao(null);
      }} onSuccess={handleSuccess} cartao={editingCartao} />
    </div>
  );
}
