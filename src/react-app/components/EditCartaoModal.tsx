import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { atualizarCartao } from '@/react-app/hooks/useApi';
import { useCurrencyFormat } from '@/react-app/hooks/useCurrencyFormat';

interface EditCartaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cartao: any;
}

export default function EditCartaoModal({
  isOpen,
  onClose,
  onSuccess,
  cartao
}: EditCartaoModalProps) {
  const { formatInputValue, parseCurrency } = useCurrencyFormat();
  const [formData, setFormData] = useState({
    nome: '',
    final4: '',
    fechamento_dia: '5',
    vencimento_dia: '10',
    limite_mensal: '',
    cor: 'azul',
    bandeira: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sincronizar dados do cartão quando abrir o modal
  useEffect(() => {
    if (cartao && isOpen) {
      setFormData({
        nome: cartao.nome || '',
        final4: cartao.final4 || '',
        fechamento_dia: cartao.fechamento_dia?.toString() || '5',
        vencimento_dia: cartao.vencimento_dia?.toString() || '10',
        limite_mensal: cartao.limite_mensal
          ? formatInputValue(cartao.limite_mensal.toFixed(2).replace('.', ''))
          : '',
        cor: cartao.cor || 'azul',
        bandeira: cartao.bandeira || '',
      });
      // Limpar erros quando carregar novos dados
      setError('');
    }
  }, [cartao, isOpen, formatInputValue]);

  const cores = [
    { key: 'preto', label: 'Preto', gradient: 'from-gray-800 to-black' },
    { key: 'branco', label: 'Branco', gradient: 'from-gray-100 to-white border border-gray-300' },
    { key: 'azul', label: 'Azul', gradient: 'from-blue-400 to-blue-600' },
    { key: 'azul-claro', label: 'Azul Claro', gradient: 'from-blue-200 to-blue-400' },
    { key: 'amarelo', label: 'Amarelo', gradient: 'from-yellow-400 to-orange-400' },
    { key: 'verde', label: 'Verde', gradient: 'from-green-400 to-teal-500' },
    { key: 'roxo', label: 'Roxo', gradient: 'from-purple-400 to-indigo-500' },
    { key: 'rosa', label: 'Rosa', gradient: 'from-pink-400 to-rose-500' },
    { key: 'vermelho', label: 'Vermelho', gradient: 'from-red-400 to-red-600' },
    { key: 'laranja', label: 'Laranja', gradient: 'from-orange-400 to-red-500' },
  ];

  const bandeiras = [
    { key: '', label: 'Não informar' },
    { key: 'visa', label: 'Visa' },
    { key: 'mastercard', label: 'Mastercard' },
    { key: 'elo', label: 'Elo' },
    { key: 'amex', label: 'American Express' },
    { key: 'hipercard', label: 'Hipercard' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica
    if (!formData.nome.trim()) {
      setError('Nome do cartão é obrigatório');
      return;
    }

    if (formData.final4 && formData.final4.length !== 4) {
      setError('Últimos 4 dígitos devem ter exatamente 4 números');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = {
        nome: formData.nome.trim(),
        final4: formData.final4 || null,
        fechamento_dia: parseInt(formData.fechamento_dia),
        vencimento_dia: parseInt(formData.vencimento_dia),
        limite_mensal: formData.limite_mensal ? parseCurrency(formData.limite_mensal) : null,
        cor: formData.cor || 'azul',
        bandeira: formData.bandeira || null,
      };

      await atualizarCartao(cartao.id, data);

      // Disparar evento de atualização
      window.dispatchEvent(new CustomEvent('financeDataUpdated'));

      // Aguardar um pequeno delay antes de fechar o modal para garantir que a atualização seja processada
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 300);
    } catch (error) {
      console.error('Erro ao atualizar cartão:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(`Erro ao editar cartão: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setError(''); // Limpar erro ao digitar
    setFormData({ ...formData, [field]: value });
  };

  const handleNumericInput = (field: string, value: string) => {
    // Remove caracteres não numéricos
    const numericValue = value.replace(/\D/g, '');
    handleInputChange(field, numericValue);
  };

  if (!cartao) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Cartão de Crédito"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Mensagem de erro */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        {/* Nome do cartão */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome do cartão
          </label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => handleInputChange('nome', e.target.value)}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300/70 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            placeholder="Ex: Nubank, Inter, Itaú..."
            required
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="words"
          />
        </div>

        {/* Final 4 dígitos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Últimos 4 dígitos (opcional)
          </label>
          <input
            type="tel"
            maxLength={4}
            value={formData.final4}
            onChange={(e) => handleNumericInput('final4', e.target.value)}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300/70 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            placeholder="1234"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
          />
        </div>

        {/* Bandeira */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bandeira
          </label>
          <select
            value={formData.bandeira}
            onChange={(e) => handleInputChange('bandeira', e.target.value)}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300/70 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base appearance-none bg-white"
          >
            {bandeiras.map((bandeira) => (
              <option key={bandeira.key} value={bandeira.key}>
                {bandeira.label}
              </option>
            ))}
          </select>
        </div>

        {/* Cor do cartão */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Cor do cartão
          </label>
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {cores.map((cor) => {
              const isCorClara = cor.key === 'branco' || cor.key === 'amarelo' || cor.key === 'azul-claro';
              return (
                <button
                  key={cor.key}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleInputChange('cor', cor.key);
                  }}
                  className={`relative p-3 sm:p-4 rounded-xl bg-gradient-to-r ${cor.gradient} transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation ${formData.cor === cor.key ? 'ring-2 ring-blue-500 scale-105' : ''
                    }`}
                  title={cor.label}
                  aria-label={`Selecionar cor ${cor.label}`}
                >
                  <div className={`w-5 h-3 sm:w-6 sm:h-4 rounded ${isCorClara ? 'bg-gray-700' : 'bg-white/80'}`} />
                  {formData.cor === cor.key && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-2 h-2 rounded-full ${isCorClara ? 'bg-blue-600' : 'bg-white'}`} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Datas */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dia do fechamento
            </label>
            <select
              value={formData.fechamento_dia}
              onChange={(e) => handleInputChange('fechamento_dia', e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300/70 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base appearance-none bg-white"
              required
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(dia => (
                <option key={dia} value={dia}>Dia {dia}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dia do vencimento
            </label>
            <select
              value={formData.vencimento_dia}
              onChange={(e) => handleInputChange('vencimento_dia', e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300/70 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base appearance-none bg-white"
              required
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map(dia => (
                <option key={dia} value={dia}>Dia {dia}</option>
              ))}
            </select>
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
              handleInputChange('limite_mensal', formatted);
            }}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            placeholder="0,00"
            autoComplete="off"
          />
        </div>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1 py-3 sm:py-2"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.nome.trim()}
            className="flex-1 py-3 sm:py-2"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
