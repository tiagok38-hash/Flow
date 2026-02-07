import { useState, useEffect } from 'react';
import { TrendingDown, TrendingUp, Calendar } from 'lucide-react';
import { useCategorias, criarLancamentoFixo, atualizarLancamentoFixo } from '@/react-app/hooks/useApi';
import { useCurrencyFormat } from '@/react-app/hooks/useCurrencyFormat';
import Modal from './Modal';
import Button from './Button';
import Icon from './Icon';
import CategoriaModal from './CategoriaModal';

interface LancamentoFixoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lancamentoFixo?: any;
}

export default function LancamentoFixoModal({
  isOpen,
  onClose,
  onSuccess,
  lancamentoFixo
}: LancamentoFixoModalProps) {
  const { data: categorias, refetch: refetchCategorias } = useCategorias();
  const { formatInputValue, parseCurrency } = useCurrencyFormat();
  const [tipoAtivo, setTipoAtivo] = useState<'despesa' | 'receita'>('despesa');

  const [formData, setFormData] = useState({
    nome: '',
    categoria_id: '',
    valor: '',
    icone: 'circle',
    periodicidade: 'mensal' as 'diario' | 'semanal' | 'quinzenal' | 'mensal',
    dia_semana: '1', // Segunda-feira
    dia_mes_1: '1',
    dia_mes_2: '15',
  });

  const [loading, setLoading] = useState(false);
  const [categoriaModalOpen, setCategoriaModalOpen] = useState(false);

  // Lista de ícones disponíveis (mesmos das categorias)
  const iconesDisponiveis = [
    'utensils', 'home', 'bus', 'gamepad', 'heart', 'book', 'shirt', 'scissors',
    'briefcase', 'users', 'baby', 'tv', 'wifi', 'droplets', 'plane', 'bath',
    'palette', 'footprints', 'dumbbell', 'car', 'music', 'shopping-bag', 'zap',
    'camera', 'phone', 'coffee', 'gift', 'award', 'piggy-bank', 'dollar-sign',
    'trophy', 'medal', 'beauty', 'circle'
  ];

  const diasSemana = [
    { valor: '1', nome: 'Segunda-feira' },
    { valor: '2', nome: 'Terça-feira' },
    { valor: '3', nome: 'Quarta-feira' },
    { valor: '4', nome: 'Quinta-feira' },
    { valor: '5', nome: 'Sexta-feira' },
    { valor: '6', nome: 'Sábado' },
    { valor: '0', nome: 'Domingo' },
  ];

  // Preencher dados se editando
  useEffect(() => {
    if (lancamentoFixo) {
      setTipoAtivo(lancamentoFixo.tipo);
      setFormData({
        nome: lancamentoFixo.nome || '',
        categoria_id: lancamentoFixo.categoria_id || '',
        valor: lancamentoFixo.valor ? formatInputValue(lancamentoFixo.valor.toFixed(2)) : '',
        icone: lancamentoFixo.icone || 'circle',
        periodicidade: lancamentoFixo.periodicidade || 'mensal',
        dia_semana: lancamentoFixo.dia_semana?.toString() || '1',
        dia_mes_1: lancamentoFixo.dia_mes_1?.toString() || '1',
        dia_mes_2: lancamentoFixo.dia_mes_2?.toString() || '15',
      });
    } else {
      // Reset para novo
      setTipoAtivo('despesa');
      setFormData({
        nome: '',
        categoria_id: '',
        valor: '',
        icone: 'circle',
        periodicidade: 'mensal',
        dia_semana: '1',
        dia_mes_1: '1',
        dia_mes_2: '15',
      });
    }
  }, [lancamentoFixo, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.valor) return;

    setLoading(true);
    try {
      const valorFloat = parseCurrency(formData.valor);

      const dados = {
        tipo: tipoAtivo,
        nome: formData.nome,
        categoria_id: formData.categoria_id || null,
        valor: valorFloat,
        icone: formData.icone,
        periodicidade: formData.periodicidade,
        dia_semana: formData.periodicidade === 'semanal' ? parseInt(formData.dia_semana) : null,
        dia_mes_1: ['quinzenal', 'mensal'].includes(formData.periodicidade) ? parseInt(formData.dia_mes_1) : null,
        dia_mes_2: formData.periodicidade === 'quinzenal' ? parseInt(formData.dia_mes_2) : null,
      };

      if (lancamentoFixo) {
        await atualizarLancamentoFixo(lancamentoFixo.id, dados);
      } else {
        await criarLancamentoFixo(dados);
      }

      // Reset form
      setFormData({
        nome: '',
        categoria_id: '',
        valor: '',
        icone: 'circle',
        periodicidade: 'mensal',
        dia_semana: '1',
        dia_mes_1: '1',
        dia_mes_2: '15',
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar lançamento fixo:', error);
      alert('Erro ao salvar lançamento fixo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoriaChange = (value: string) => {
    if (value === 'nova-categoria') {
      setCategoriaModalOpen(true);
    } else {
      setFormData({ ...formData, categoria_id: value });
    }
  };

  const handleCategoriaSuccess = () => {
    refetchCategorias();
    setCategoriaModalOpen(false);
  };

  const renderConfiguracaoPeriodo = () => {
    switch (formData.periodicidade) {
      case 'diario':
        return (
          <div className="p-4 bg-blue-50 rounded-2xl">
            <p className="text-sm text-blue-700 font-medium">
              📅 Será adicionado automaticamente todos os dias
            </p>
          </div>
        );

      case 'semanal':
        return (
          <div>
            <label className="block text-sm font-light text-gray-700 mb-3">
              Dia da semana
            </label>
            <select
              value={formData.dia_semana}
              onChange={(e) => setFormData({ ...formData, dia_semana: e.target.value })}
              className="w-full px-4 py-3 bg-white/70 border border-gray-300/70 rounded-2xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 font-light"
            >
              {diasSemana.map((dia) => (
                <option key={dia.valor} value={dia.valor}>
                  {dia.nome}
                </option>
              ))}
            </select>
          </div>
        );

      case 'quinzenal':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-light text-gray-700 mb-3">
                Primeiro dia do mês
              </label>
              <select
                value={formData.dia_mes_1}
                onChange={(e) => setFormData({ ...formData, dia_mes_1: e.target.value })}
                className="w-full px-4 py-3 bg-white/70 border border-gray-300/70 rounded-2xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 font-light"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map(dia => (
                  <option key={dia} value={dia.toString()}>
                    Dia {dia}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-light text-gray-700 mb-3">
                Segundo dia do mês
              </label>
              <select
                value={formData.dia_mes_2}
                onChange={(e) => setFormData({ ...formData, dia_mes_2: e.target.value })}
                className="w-full px-4 py-3 bg-white/70 border border-gray-300/70 rounded-2xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 font-light"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map(dia => (
                  <option key={dia} value={dia.toString()}>
                    Dia {dia}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'mensal':
        return (
          <div>
            <label className="block text-sm font-light text-gray-700 mb-3">
              Dia do mês
            </label>
            <select
              value={formData.dia_mes_1}
              onChange={(e) => setFormData({ ...formData, dia_mes_1: e.target.value })}
              className="w-full px-4 py-3 bg-white/70 border border-gray-300/70 rounded-2xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 font-light"
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map(dia => (
                <option key={dia} value={dia.toString()}>
                  Dia {dia}
                </option>
              ))}
            </select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200">
              <Calendar className="text-gray-600" size={20} />
            </div>
            <span>{lancamentoFixo ? "Editar Gasto/Receita Fixa" : "Novo Gasto/Receita Fixa"}</span>
          </div>
        }
        maxWidth="max-w-md lg:max-w-lg xl:max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tabs para tipo */}
          <div className="flex bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-1.5 shadow-inner">
            <button
              type="button"
              onClick={() => setTipoAtivo('despesa')}
              className={`flex-1 py-3 px-4 rounded-xl font-light transition-all duration-300 flex items-center justify-center gap-2 text-sm ${tipoAtivo === 'despesa'
                ? 'bg-gradient-to-r from-orange-400 to-red-400 text-white shadow-lg shadow-orange-500/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
            >
              <TrendingDown size={16} />
              Despesa Fixa
            </button>
            <button
              type="button"
              onClick={() => setTipoAtivo('receita')}
              className={`flex-1 py-3 px-4 rounded-xl font-light transition-all duration-300 flex items-center justify-center gap-2 text-sm ${tipoAtivo === 'receita'
                ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-white shadow-lg shadow-teal-500/25'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
            >
              <TrendingUp size={16} />
              Receita Fixa
            </button>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-light text-gray-700 mb-3">
              Nome
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-4 py-3 bg-white/70 border border-gray-300/70 rounded-2xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 font-light placeholder-gray-400"
              placeholder="Ex: Aluguel, Salário, Internet..."
              required
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-light text-gray-700 mb-3">
              Categoria (Opcional)
            </label>
            <div className="relative">
              <select
                value={formData.categoria_id}
                onChange={(e) => handleCategoriaChange(e.target.value)}
                className="w-full px-4 py-3 bg-white/70 border border-gray-300/70 rounded-2xl focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all duration-200 font-light appearance-none"
              >
                <option value="">Sem categoria</option>
                {categorias?.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome}
                  </option>
                ))}
                <option value="nova-categoria" className="font-medium text-teal-600">
                  + Criar nova categoria
                </option>
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

          {/* Ícone */}
          <div>
            <label className="block text-sm font-light text-gray-700 mb-3">
              Ícone
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-2xl p-3 bg-gray-50/50">
              {iconesDisponiveis.map((icone) => (
                <button
                  key={icone}
                  type="button"
                  onClick={() => setFormData({ ...formData, icone })}
                  className={`p-3 rounded-xl transition-all duration-200 hover:scale-110 shadow-sm ${formData.icone === icone
                    ? 'bg-teal-500 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200/50'
                    }`}
                >
                  <Icon name={icone} size={18} />
                </button>
              ))}
            </div>
          </div>

          {/* Periodicidade */}
          <div>
            <label className="block text-sm font-light text-gray-700 mb-3">
              Periodicidade
            </label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { valor: 'diario', nome: 'Diário' },
                { valor: 'semanal', nome: 'Semanal' },
                { valor: 'quinzenal', nome: 'Quinzenal' },
                { valor: 'mensal', nome: 'Mensal' },
              ].map((periodo) => (
                <button
                  key={periodo.valor}
                  type="button"
                  onClick={() => setFormData({ ...formData, periodicidade: periodo.valor as any })}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-200 ${formData.periodicidade === periodo.valor
                    ? 'bg-teal-500 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                >
                  {periodo.nome}
                </button>
              ))}
            </div>

            {renderConfiguracaoPeriodo()}
          </div>

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
              {loading ? 'Salvando...' : (lancamentoFixo ? 'Atualizar' : 'Salvar')}
            </Button>
          </div>
        </form>
      </Modal>

      <CategoriaModal
        isOpen={categoriaModalOpen}
        onClose={() => setCategoriaModalOpen(false)}
        onSuccess={handleCategoriaSuccess}
      />
    </>
  );
}
