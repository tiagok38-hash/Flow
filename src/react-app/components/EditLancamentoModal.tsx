import { useState, useEffect } from 'react';
import { useCategorias, useCartoes, atualizarLancamento } from '@/react-app/hooks/useApi';
import { useCurrencyFormat } from '@/react-app/hooks/useCurrencyFormat';
import Modal from './Modal';
import Button from './Button';

interface EditLancamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lancamento: any;
}

export default function EditLancamentoModal({
  isOpen,
  onClose,
  onSuccess,
  lancamento
}: EditLancamentoModalProps) {
  const { data: categorias } = useCategorias();
  const { data: cartoes } = useCartoes();
  const { formatInputValue, parseCurrency } = useCurrencyFormat();

  const [formData, setFormData] = useState({
    descricao: '',
    categoria_id: '',
    valor: '',
    data: '',
    forma_pagamento: 'Pix' as 'Dinheiro' | 'Pix' | 'Débito' | 'Cartão',
    cartao_id: '',
    status: 'pago' as 'pago' | 'pendente',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lancamento) {
      setFormData({
        descricao: lancamento.descricao || '',
        categoria_id: lancamento.categoria_id || '',
        valor: formatInputValue(Math.abs(lancamento.valor || 0).toFixed(2)),
        data: lancamento.data || '',
        forma_pagamento: lancamento.forma_pagamento || 'Pix',
        cartao_id: lancamento.cartao_id || '',
        status: lancamento.status || 'pago',
      });
    }
  }, [lancamento, isOpen, formatInputValue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        tipo: lancamento.tipo, // Incluir o tipo do lançamento
        descricao: formData.descricao,
        categoria_id: formData.categoria_id || null,
        valor: parseCurrency(formData.valor),
        data: formData.data,
        forma_pagamento: formData.forma_pagamento,
        cartao_id: formData.cartao_id || null,
        status: formData.status,
      };

      await atualizarLancamento(lancamento.id, data);

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao editar lançamento:', error);
      alert('Erro ao editar lançamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!lancamento) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Lançamento"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição
          </label>
          <input
            type="text"
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300/70 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria {lancamento.tipo === 'receita' ? '(Opcional)' : ''}
          </label>
          <select
            value={formData.categoria_id}
            onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300/70 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={lancamento.tipo === 'despesa'}
          >
            <option value="">Selecione uma categoria</option>
            {categorias?.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Valor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor
          </label>
          <input
            type="text"
            value={formData.valor}
            onChange={(e) => {
              const formatted = formatInputValue(e.target.value);
              setFormData({ ...formData, valor: formatted });
            }}
            className="w-full px-4 py-2 border border-gray-300/70 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            placeholder="0,00"
          />
        </div>

        {/* Data */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data
          </label>
          <input
            type="date"
            value={formData.data}
            onChange={(e) => setFormData({ ...formData, data: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300/70 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Forma de pagamento (apenas para despesas) */}
        {lancamento.tipo === 'despesa' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forma de pagamento
            </label>
            <select
              value={formData.forma_pagamento}
              onChange={(e) => setFormData({ ...formData, forma_pagamento: e.target.value as any })}
              className="w-full px-4 py-2 border border-gray-300/70 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="Pix">Pix</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Débito">Débito</option>
              <option value="Cartão">Cartão</option>
            </select>
          </div>
        )}

        {/* Cartão */}
        {formData.forma_pagamento === 'Cartão' && lancamento.tipo === 'despesa' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cartão
            </label>
            <select
              value={formData.cartao_id}
              onChange={(e) => setFormData({ ...formData, cartao_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300/70 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione um cartão</option>
              {cartoes?.map((cartao) => (
                <option key={cartao.id} value={cartao.id}>
                  {cartao.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300/70 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="pago">Pago</option>
            <option value="pendente">Pendente</option>
          </select>
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
            {loading ? 'Salvando...' : 'Atualizar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
