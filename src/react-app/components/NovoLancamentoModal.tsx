import { useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useCategorias, useCartoes, criarLancamento, formatarMoeda } from '@/react-app/hooks/useApi';
import { useCurrencyFormat } from '@/react-app/hooks/useCurrencyFormat';
import { NovoLancamento } from '@/shared/types';
import Modal from './Modal';
import Button from './Button';
import CategoriaModal from './CategoriaModal';

interface NovoLancamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  animationOrigin?: { x: number; y: number } | null;
}

export default function NovoLancamentoModal({
  isOpen,
  onClose,
  onSuccess,
  animationOrigin = null
}: NovoLancamentoModalProps) {
  const { data: categorias, refetch: refetchCategorias, loading: loadingCategorias, error: errorCategorias } = useCategorias();
  const { data: cartoes } = useCartoes();
  const { formatInputValue, parseCurrency } = useCurrencyFormat();

  // Função para obter data atual no fuso horário do Brasil
  const getDataAtualBrasil = () => {
    const agora = new Date();
    const brasilia = new Date(agora.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    return brasilia.toISOString().split('T')[0];
  };

  const [tipoAtivo, setTipoAtivo] = useState<'despesa' | 'receita'>('despesa');
  const [formData, setFormData] = useState({
    descricao: '',
    categoria_id: '',
    valor: '',
    data: getDataAtualBrasil(),
    forma_pagamento: 'Pix' as 'Dinheiro' | 'Pix' | 'Débito' | 'Cartão',
    cartao_id: '',
    parcelado: false,
    parcelas: '1',
  });
  const [loading, setLoading] = useState(false);
  const [categoriaModalOpen, setCategoriaModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.descricao || !formData.valor) return;

    // Validação: se for despesa, categoria é obrigatória
    if (tipoAtivo === 'despesa' && !formData.categoria_id) {
      alert('Por favor, selecione uma categoria para a despesa.');
      return;
    }

    setLoading(true);
    try {
      const valorFloat = parseCurrency(formData.valor);

      // Se for parcelado no cartão, criar múltiplos lançamentos
      if (formData.parcelado && formData.forma_pagamento === 'Cartão' && parseInt(formData.parcelas) > 1) {
        const numParcelas = parseInt(formData.parcelas);
        const valorParcela = valorFloat / numParcelas;

        for (let i = 0; i < numParcelas; i++) {
          const dataLancamento = new Date(formData.data);
          dataLancamento.setMonth(dataLancamento.getMonth() + i);

          const dados: NovoLancamento = {
            tipo: tipoAtivo,
            descricao: `${formData.descricao} (${i + 1}/${numParcelas})`,
            categoria_id: tipoAtivo === 'despesa' ? formData.categoria_id : undefined,
            valor: valorParcela,
            data: dataLancamento.toISOString().split('T')[0],
            forma_pagamento: formData.forma_pagamento,
            cartao_id: formData.cartao_id || undefined,
          };

          await criarLancamento(dados);
        }
      } else {
        // Lançamento único
        const dados: NovoLancamento = {
          tipo: tipoAtivo,
          descricao: formData.descricao,
          categoria_id: tipoAtivo === 'despesa' ? formData.categoria_id : undefined,
          valor: valorFloat,
          data: formData.data,
          forma_pagamento: formData.forma_pagamento,
          cartao_id: formData.cartao_id || undefined,
        };

        await criarLancamento(dados);
      }

      // Animação de sucesso
      const successAnimation = document.createElement('div');
      successAnimation.className = 'fixed top-4 right-4 bg-teal-500 text-white px-6 py-3 rounded-2xl shadow-lg animate-slide-down z-50';
      successAnimation.textContent = 'Lançamento anotado com sucesso!';
      document.body.appendChild(successAnimation);

      setTimeout(() => {
        document.body.removeChild(successAnimation);
      }, 3000);

      // Reset form primeiro
      setFormData({
        descricao: '',
        categoria_id: '',
        valor: '',
        data: getDataAtualBrasil(),
        forma_pagamento: 'Pix',
        cartao_id: '',
        parcelado: false,
        parcelas: '1',
      });

      // Chamar onSuccess e onClose
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao criar lançamento:', error);
      alert('Erro ao criar lançamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleTipoChange = (novoTipo: 'despesa' | 'receita') => {
    setTipoAtivo(novoTipo);
    // Limpar categoria ao mudar tipo
    setFormData({
      ...formData,
      categoria_id: '',
      parcelado: false,
      parcelas: '1'
    });
  };

  const handleCategoriaChange = (value: string) => {
    if (value === 'nova-categoria') {
      setCategoriaModalOpen(true);
    } else {
      setFormData({ ...formData, categoria_id: value });
    }
  };

  const handleCategoriaSuccess = (novaCategoria?: any) => {
    refetchCategorias();
    setCategoriaModalOpen(false);
    if (novaCategoria && novaCategoria.id) {
      setFormData(prev => ({ ...prev, categoria_id: novaCategoria.id }));
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Anotar gasto ou receita"
        maxWidth="max-w-md lg:max-w-md xl:max-w-lg"
        animationOrigin={animationOrigin}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tabs para tipo */}
          <div className="flex bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-1.5 shadow-inner w-full">
            <button
              type="button"
              onClick={() => handleTipoChange('despesa')}
              className={`flex-1 py-3 px-3 sm:px-6 rounded-xl font-light transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base min-h-[44px] ${tipoAtivo === 'despesa'
                ? 'bg-gradient-to-r from-orange-400 to-red-400 text-white shadow-lg shadow-orange-500/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
            >
              <TrendingDown size={16} className="flex-shrink-0" />
              <span className="whitespace-nowrap font-medium">Despesa</span>
            </button>
            <button
              type="button"
              onClick={() => handleTipoChange('receita')}
              className={`flex-1 py-3 px-3 sm:px-6 rounded-xl font-light transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base min-h-[44px] ${tipoAtivo === 'receita'
                ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-white shadow-lg shadow-teal-500/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
            >
              <TrendingUp size={16} className="flex-shrink-0" />
              <span className="whitespace-nowrap font-medium">Receita</span>
            </button>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-light text-gray-700 mb-3">
              Descrição
            </label>
            <input
              type="text"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full px-4 py-3 bg-white/70 border border-gray-300/70 rounded-2xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 font-light placeholder-gray-400"
              placeholder="Ex: Mercado, Gasolina, Salário..."
              required
            />
          </div>

          {/* Categoria (apenas para despesas) */}
          {tipoAtivo === 'despesa' && (
            <div>
              <label className="block text-sm font-light text-gray-700 mb-3">
                Categoria
              </label>
              <div className="relative">
                {loadingCategorias ? (
                  <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300/70 rounded-2xl flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-400 mr-2"></div>
                    <span className="text-sm text-gray-500">Carregando categorias...</span>
                  </div>
                ) : errorCategorias ? (
                  <div className="w-full px-4 py-3 bg-red-50 border border-red-300/70 rounded-2xl space-y-2">
                    <div className="text-sm text-red-600">
                      <strong>Erro ao carregar categorias:</strong>
                      <br />
                      {errorCategorias?.message || 'Erro desconhecido'}
                    </div>
                    <div className="text-xs text-red-500">
                      Network: {navigator.onLine ? 'Online' : 'Offline'} |
                      Browser: {navigator.userAgent.includes('iPhone') ? 'iPhone Safari' : 'Outro'}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        refetchCategorias();
                      }}
                      className="w-full mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                      🔄 Tentar novamente
                    </button>
                  </div>
                ) : !categorias || categorias.length === 0 ? (
                  <div className="w-full px-4 py-3 bg-yellow-50 border border-yellow-300/70 rounded-2xl space-y-2">
                    <div className="text-sm text-yellow-600">
                      <strong>Nenhuma categoria encontrada</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        refetchCategorias();
                      }}
                      className="w-full mt-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-xl text-sm font-medium hover:bg-yellow-200 transition-colors"
                    >
                      🔄 Recarregar categorias
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.categoria_id}
                    onChange={(e) => handleCategoriaChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white/70 border border-gray-300/70 rounded-2xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 font-light appearance-none"
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categorias?.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </option>
                    ))}
                    <option value="nova-categoria" className="font-medium text-teal-600">
                      + Criar nova categoria
                    </option>
                  </select>
                )}
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <div className="w-5 h-5 text-gray-400">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Categoria (para receitas - opcional) */}
          {tipoAtivo === 'receita' && (
            <div>
              <label className="block text-sm font-light text-gray-700 mb-3">
                Categoria (Opcional)
              </label>
              <div className="relative">
                {loadingCategorias ? (
                  <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300/70 rounded-2xl flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-400 mr-2"></div>
                    <span className="text-sm text-gray-500">Carregando categorias...</span>
                  </div>
                ) : errorCategorias ? (
                  <div className="w-full px-4 py-3 bg-red-50 border border-red-300/70 rounded-2xl space-y-2">
                    <div className="text-sm text-red-600">
                      <strong>Erro ao carregar categorias:</strong>
                      <br />
                      {errorCategorias?.message || 'Erro desconhecido'}
                    </div>
                    <div className="text-xs text-red-500">
                      Network: {navigator.onLine ? 'Online' : 'Offline'} |
                      Browser: {navigator.userAgent.includes('iPhone') ? 'iPhone Safari' : 'Outro'}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        refetchCategorias();
                      }}
                      className="w-full mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl text-sm font-medium hover:bg-red-200 transition-colors"
                    >
                      🔄 Tentar novamente
                    </button>
                  </div>
                ) : !categorias || categorias.length === 0 ? (
                  <div className="w-full px-4 py-3 bg-yellow-50 border border-yellow-300/70 rounded-2xl space-y-2">
                    <div className="text-sm text-yellow-600">
                      <strong>Nenhuma categoria encontrada</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        console.log('[iPhone Debug] Tentando recarregar categorias vazias...');
                        refetchCategorias();
                      }}
                      className="w-full mt-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-xl text-sm font-medium hover:bg-yellow-200 transition-colors"
                    >
                      🔄 Recarregar categorias
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.categoria_id}
                    onChange={(e) => handleCategoriaChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white/70 border border-gray-300/70 rounded-2xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 font-light appearance-none"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categorias?.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </option>
                    ))}
                    <option value="nova-categoria" className="font-medium text-teal-600">
                      + Criar nova categoria
                    </option>
                  </select>
                )}
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <div className="w-5 h-5 text-gray-400">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Valor */}
          <div>
            <label className="block text-sm font-light text-gray-700 mb-3">
              Valor
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.valor}
                onChange={(e) => {
                  const formatted = formatInputValue(e.target.value);
                  setFormData({ ...formData, valor: formatted });
                }}
                className="w-full pl-12 pr-4 py-3 bg-white/70 border border-gray-300/70 rounded-2xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 font-light placeholder-gray-400"
                placeholder="0,00"
                required
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <span className="text-gray-500 font-light">R$</span>
              </div>
            </div>
          </div>

          {/* Data */}
          <div>
            <label className="block text-sm font-light text-gray-700 mb-3">
              Data
            </label>
            <input
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              className="w-full px-4 py-3 bg-white/70 border border-gray-300/70 rounded-2xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 font-light"
              required
            />
          </div>

          {/* Forma de pagamento (apenas para despesas) */}
          {tipoAtivo === 'despesa' && (
            <div>
              <label className="block text-sm font-light text-gray-700 mb-3">
                Forma de Pagamento
              </label>
              <div className="relative">
                <select
                  value={formData.forma_pagamento}
                  onChange={(e) => setFormData({ ...formData, forma_pagamento: e.target.value as any })}
                  className="w-full px-4 py-3 bg-white/70 border border-gray-300/70 rounded-2xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 font-light appearance-none"
                  required
                >
                  <option value="Pix">Pix</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Débito">Débito</option>
                  <option value="Cartão">Cartão</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <div className="w-5 h-5 text-gray-400">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cartão (se forma de pagamento for cartão e for despesa) */}
          {formData.forma_pagamento === 'Cartão' && tipoAtivo === 'despesa' && (
            <div>
              <label className="block text-sm font-light text-gray-700 mb-3">
                Cartão
              </label>
              <div className="relative">
                <select
                  value={formData.cartao_id}
                  onChange={(e) => setFormData({ ...formData, cartao_id: e.target.value })}
                  className="w-full px-4 py-3 bg-white/70 border border-gray-300/70 rounded-2xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 font-light appearance-none"
                >
                  <option value="">Selecione um cartão</option>
                  {cartoes?.map((cartao) => (
                    <option key={cartao.id} value={cartao.id}>
                      {cartao.nome}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <div className="w-5 h-5 text-gray-400">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Parcelamento (apenas para cartão) */}
          {formData.forma_pagamento === 'Cartão' && tipoAtivo === 'despesa' && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="parcelado"
                  checked={formData.parcelado}
                  onChange={(e) => setFormData({ ...formData, parcelado: e.target.checked, parcelas: e.target.checked ? formData.parcelas : '1' })}
                  className="w-4 h-4 text-teal-500 bg-white/70 border-gray-300/70 rounded focus:ring-teal-400 focus:ring-2"
                />
                <label htmlFor="parcelado" className="text-sm font-light text-gray-700">
                  Compra parcelada
                </label>
              </div>

              {formData.parcelado && (
                <div>
                  <label className="block text-sm font-light text-gray-700 mb-3">
                    Número de parcelas
                  </label>
                  <select
                    value={formData.parcelas}
                    onChange={(e) => setFormData({ ...formData, parcelas: e.target.value })}
                    className="w-full px-4 py-3 bg-white/70 border border-gray-300/70 rounded-2xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 font-light appearance-none"
                  >
                    {Array.from({ length: 24 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num.toString()}>
                        {num}x {num === 1 ? '(à vista)' : `de ${formatarMoeda(parseCurrency(formData.valor) / num)}`}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-400 mt-2 font-light">
                    Cada parcela será lançada automaticamente a cada mês
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-4 pt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant={tipoAtivo === 'despesa' ? 'danger' : 'primary'}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Salvando...' : 'Anotar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de categoria */}
      <CategoriaModal
        isOpen={categoriaModalOpen}
        onClose={() => setCategoriaModalOpen(false)}
        onSuccess={handleCategoriaSuccess}
      />
    </>
  );
}
