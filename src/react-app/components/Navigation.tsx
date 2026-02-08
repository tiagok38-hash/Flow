import { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { Plus, Home, History, CreditCard, Settings, Wallet } from 'lucide-react';
import NovoLancamentoModal from './NovoLancamentoModal';

export default function Navigation() {
  const location = useLocation();
  const [novoLancamentoModalOpen, setNovoLancamentoModalOpen] = useState(false);
  const [buttonOrigin, setButtonOrigin] = useState<{ x: number; y: number } | null>(null);
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const desktopPlusButtonRef = useRef<HTMLButtonElement>(null);

  const handleSuccess = () => {
    // Disparar evento para atualizar dados em toda a aplicação
    window.dispatchEvent(new CustomEvent('financeDataUpdated'));
    setNovoLancamentoModalOpen(false);
  };

  const handleOpenModal = (ref: React.RefObject<HTMLButtonElement | null>) => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      setButtonOrigin({ x, y });
    }
    setNovoLancamentoModalOpen(true);
  };

  const navLinks = [
    { to: '/', icon: Home, label: 'Início' },
    { to: '/historico', icon: History, label: 'Histórico' },
    { to: '/cartoes', icon: CreditCard, label: 'Cartões' },
    { to: '/configuracoes', icon: Settings, label: 'Ajustes' },
  ];

  return (
    <>
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-teal-500 to-cyan-600 z-50 flex-col p-6 shadow-2xl">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 px-2 mt-4">
          <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner">
            <Wallet size={24} className="text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">Flow</span>
        </div>

        {/* Navigation Links */}
        <div className="space-y-2 flex-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group ${isActive
                    ? 'bg-white text-teal-600 shadow-lg shadow-black/5 scale-105'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <Icon size={22} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className="font-medium">{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          ref={desktopPlusButtonRef}
          onClick={() => handleOpenModal(desktopPlusButtonRef)}
          className="mt-auto mb-4 flex items-center justify-center gap-3 p-4 bg-white text-teal-600 rounded-2xl font-bold shadow-xl shadow-black/10 hover:scale-[1.03] active:scale-95 transition-all duration-200"
        >
          <div className="p-1 bg-teal-50 rounded-lg">
            <Plus size={20} className="text-teal-500" />
          </div>
          Novo Lançamento
        </button>
      </aside>

      {/* Navegação Inferior - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="bg-white/95 backdrop-blur-md mx-2 sm:mx-4 mb-6 sm:mb-8 rounded-2xl sm:rounded-3xl shadow-2xl shadow-gray-400/30">
          <div className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3">
            <div className="flex items-center justify-between w-full max-w-sm mx-auto">
              <Link
                to="/"
                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 transform active:scale-95 active:bg-teal-50 hover:scale-105 ${location.pathname === '/'
                    ? 'text-teal-500 bg-teal-50 scale-105'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <Home size={24} className="sm:w-7 sm:h-7 transition-transform duration-300" />
              </Link>

              <Link
                to="/historico"
                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 transform active:scale-95 active:bg-teal-50 hover:scale-105 ${location.pathname === '/historico'
                    ? 'text-teal-500 bg-teal-50 scale-105'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <History size={24} className="sm:w-7 sm:h-7 transition-transform duration-300" />
              </Link>

              <button
                ref={plusButtonRef}
                onClick={() => handleOpenModal(plusButtonRef)}
                className="p-3 sm:p-4 bg-gradient-to-r from-teal-400 to-cyan-400 text-white rounded-2xl sm:rounded-3xl shadow-lg shadow-teal-500/25 hover:scale-110 active:scale-90 transition-all duration-500 ease-out transform hover:shadow-2xl hover:shadow-teal-500/40 active:shadow-teal-500/50 hover:rotate-90"
              >
                <Plus size={24} className="sm:w-7 sm:h-7 transition-all duration-500 ease-out" />
              </button>

              <Link
                to="/cartoes"
                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 transform active:scale-95 active:bg-teal-50 hover:scale-105 ${location.pathname === '/cartoes'
                    ? 'text-teal-500 bg-teal-50 scale-105'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <CreditCard size={24} className="sm:w-7 sm:h-7 transition-transform duration-300" />
              </Link>

              <Link
                to="/configuracoes"
                className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 transform active:scale-95 active:bg-teal-50 hover:scale-105 ${location.pathname === '/configuracoes'
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

      <NovoLancamentoModal
        isOpen={novoLancamentoModalOpen}
        onClose={() => setNovoLancamentoModalOpen(false)}
        onSuccess={handleSuccess}
        animationOrigin={buttonOrigin}
      />
    </>
  );
}

