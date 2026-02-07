import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import Icon from './Icon';
import { criarCategoria, atualizarCategoria } from '@/react-app/hooks/useApi';
import { useCurrencyFormat } from '@/react-app/hooks/useCurrencyFormat';

interface CategoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (categoria?: any) => void;
  categoria?: any;
}

export default function CategoriaModal({
  isOpen,
  onClose,
  onSuccess,
  categoria
}: CategoriaModalProps) {
  const { formatInputValue, parseCurrency } = useCurrencyFormat();
  const [formData, setFormData] = useState({
    nome: '',
    icone: 'circle',
    limite_mensal: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (categoria) {
      setFormData({
        nome: categoria.nome || '',
        icone: categoria.icone || 'circle',
        limite_mensal: categoria.limite_mensal?.toString() || '',
      });
    } else {
      setFormData({
        nome: '',
        icone: 'circle',
        limite_mensal: '',
      });
    }
  }, [categoria, isOpen]);

  const icones = [
    'utensils', 'bus', 'home', 'gamepad', 'heart', 'sparkles',
    'book', 'wallet', 'credit-card', 'piggy-bank', 'dollar-sign',
    'shirt', 'scissors', 'beauty', 'briefcase', 'users', 'baby',
    'tv', 'wifi', 'droplets', 'plane', 'bath', 'palette',
    'footprints', 'dumbbell', 'utensils-crossed', 'car', 'music',
    'shopping-bag', 'zap', 'camera', 'phone', 'coffee', 'gift'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        nome: formData.nome.trim(),
        icone: formData.icone,
        limite_mensal: formData.limite_mensal ? parseCurrency(formData.limite_mensal) : null,
      };

      let result;
      if (categoria) {
        result = await atualizarCategoria(categoria.id, data);
      } else {
        result = await criarCategoria(data);
      }

      setFormData({
        nome: '',
        icone: 'circle',
        limite_mensal: '',
      });
      onSuccess(result);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar categoria');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={categoria ? 'Editar Categoria' : 'Nova Categoria'}
      maxWidth="max-w-md lg:max-w-md xl:max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nome da categoria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome da categoria
          </label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300/70 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Alimentação, Transporte..."
            required
          />
        </div>

        {/* Ícone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Ícone
          </label>
          <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
            {icones.map((icone) => (
              <button
                key={icone}
                type="button"
                onClick={() => setFormData({ ...formData, icone })}
                className={`p-2.5 rounded-xl border-2 transition-all duration-200 hover:scale-105 flex items-center justify-center ${formData.icone === icone
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300/70 hover:border-gray-400'
                  }`}
              >
                <Icon name={icone} size={18} className="text-gray-600" />
              </button>
            ))}
          </div>
        </div>

        {/* Limite mensal */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Limite mensal (opcional)
          </label>
          <input
            type="text"
            value={formData.limite_mensal}
            onChange={(e) => {
              const formatted = formatInputValue(e.target.value);
              setFormData({ ...formData, limite_mensal: formatted });
            }}
            className="w-full px-4 py-2 border border-gray-300/70 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0,00"
          />
          <p className="text-sm text-gray-500 mt-1">
            Você será alertado quando atingir este limite
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
            {loading ? 'Salvando...' : categoria ? 'Atualizar' : 'Criar Categoria'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
