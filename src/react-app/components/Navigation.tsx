import { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { Plus, Home, History, CreditCard, Settings } from 'lucide-react';
import NovoLancamentoModal from './NovoLancamentoModal';

export default function Navigation() {
  const location = useLocation();
  const [novoLancamentoModalOpen, setNovoLancamentoModalOpen] = useState(false);
  const [buttonOrigin, setButtonOrigin] = useState<{ x: number; y: number } | null>(null);
  const plusButtonRef = useRef<HTMLButtonElement>(null);

  const handleSuccess = () => {
    // Disparar evento para atualizar dados em toda a aplicação
    window.dispatchEvent(new CustomEvent('financeDataUpdated'));
    setNovoLancamentoModalOpen(false);
  };

  const handleOpenModal = () => {
    if (plusButtonRef.current) {
      const rect = plusButtonRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      setButtonOrigin({ x, y });
    }
    setNovoLancamentoModalOpen(true);
  };

  return (
    <>
      {/* Navegação Inferior - Design responsivo para iPhone */}
      <nav className="fixed bottom-0 left-0 right-0 z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="bg-white/95 backdrop-blur-md mx-2 sm:mx-4 mb-6 sm:mb-8 rounded-2xl sm:rounded-3xl shadow-2xl shadow-gray-400/30">
          <div className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3">
            {/* Navegação - 5 botões centralizados */}
            <div className="flex items-center justify-between w-full max-w-sm mx-auto">
              {/* Home */}
              <Link
                to="/"
                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 transform active:scale-95 active:bg-teal-50 hover:scale-105 ${
                  location.pathname === '/'
                    ? 'text-teal-500 bg-teal-50 scale-105'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Home size={24} className="sm:w-7 sm:h-7 transition-transform duration-300" />
              </Link>

              {/* Histórico */}
              <Link
                to="/historico"
                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 transform active:scale-95 active:bg-teal-50 hover:scale-105 ${
                  location.pathname === '/historico'
                    ? 'text-teal-500 bg-teal-50 scale-105'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <History size={24} className="sm:w-7 sm:h-7 transition-transform duration-300" />
              </Link>

              {/* Botão Central - Novo Lançamento */}
              <button
                ref={plusButtonRef}
                onClick={handleOpenModal}
                className="p-3 sm:p-4 bg-gradient-to-r from-teal-400 to-cyan-400 text-white rounded-2xl sm:rounded-3xl shadow-lg shadow-teal-500/25 hover:scale-110 active:scale-90 transition-all duration-500 ease-out transform hover:shadow-2xl hover:shadow-teal-500/40 active:shadow-teal-500/50 hover:rotate-90"
              >
                <Plus size={24} className="sm:w-7 sm:h-7 transition-all duration-500 ease-out" />
              </button>

              {/* Cartões */}
              <Link
                to="/cartoes"
                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 transform active:scale-95 active:bg-teal-50 hover:scale-105 ${
                  location.pathname === '/cartoes'
                    ? 'text-teal-500 bg-teal-50 scale-105'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CreditCard size={24} className="sm:w-7 sm:h-7 transition-transform duration-300" />
              </Link>

              {/* Configurações */}
              <Link
                to="/configuracoes"
                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 transform active:scale-95 active:bg-teal-50 hover:scale-105 ${
                  location.pathname === '/configuracoes'
                    ? 'text-teal-500 bg-teal-50 scale-105'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Settings size={24} className="sm:w-7 sm:h-7 transition-transform duration-300" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Modal de novo lançamento */}
      <NovoLancamentoModal
        isOpen={novoLancamentoModalOpen}
        onClose={() => setNovoLancamentoModalOpen(false)}
        onSuccess={handleSuccess}
        animationOrigin={buttonOrigin}
      />
    </>
  );
}
