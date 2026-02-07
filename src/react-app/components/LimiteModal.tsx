import { useState } from 'react';
import { useCategorias, useCartoes, atualizarCategoria, atualizarCartao } from '@/react-app/hooks/useApi';
import { useCurrencyFormat } from '@/react-app/hooks/useCurrencyFormat';
import Modal from './Modal';
import Button from './Button';

interface LimiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LimiteModal({
  isOpen,
  onClose,
  onSuccess
}: LimiteModalProps) {
  const { data: categorias } = useCategorias();
  const { data: cartoes } = useCartoes();
  const { formatInputValue, parseCurrency } = useCurrencyFormat();

  const [tipo, setTipo] = useState<'categoria' | 'cartao'>('categoria');
  const [formData, setFormData] = useState({
    id: '',
    limite: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.limite) return;

    setLoading(true);
    try {
      const valorNumerico = parseCurrency(formData.limite);

      if (tipo === 'categoria') {
        await atualizarCategoria(formData.id, {
          limite_mensal: valorNumerico
        });
      } else {
        await atualizarCartao(formData.id, {
          limite_mensal: valorNumerico
        });
      }

      setFormData({ id: '', limite: '' });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao definir limite:', error);
      alert('Erro ao definir limite. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurar Limites de Gastos"
      maxWidth="max-w-md lg:max-w-md xl:max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de limite */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => {
              setTipo('categoria');
              setFormData({ id: '', limite: '' });
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${tipo === 'categoria'
              ? 'bg-white shadow-sm text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Por Categoria
          </button>
          <button
            type="button"
            onClick={() => {
              setTipo('cartao');
              setFormData({ id: '', limite: '' });
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${tipo === 'cartao'
              ? 'bg-white shadow-sm text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            Por Cartão
          </button>
        </div>

        {/* Seleção */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {tipo === 'categoria' ? 'Categoria' : 'Cartão'}
          </label>
          <select
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300/70 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">Selecione...</option>
            {tipo === 'categoria' ? (
              categorias?.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))
            ) : (
              cartoes?.map((cartao) => (
                <option key={cartao.id} value={cartao.id}>
                  {cartao.nome}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Valor do limite */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Limite Mensal (R$)
          </label>
          <input
            type="text"
            value={formData.limite}
            onChange={(e) => {
              const formatted = formatInputValue(e.target.value);
              setFormData({ ...formData, limite: formatted });
            }}
            className="w-full px-4 py-2 border border-gray-300/70 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0,00"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            O sistema alertará quando este limite for atingido
          </p>
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-4">
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
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Salvando...' : 'Definir Limite'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
