import { useState, useEffect } from 'react';
import { User, LogOut, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/react-app/supabaseClient';
import { useValoresVisiveis } from '@/react-app/hooks/useValoresVisiveis';

export default function UserMenu() {
  const [user, setUser] = useState<any>(null);
  const { valoresVisiveis, toggleValoresVisiveis } = useValoresVisiveis();
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.replace('/login');
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        {/* Botão de ocultar valores */}
        <button
          onClick={toggleValoresVisiveis}
          className="p-3 bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-300/70 rounded-2xl transition-all duration-200 shadow-lg transform active:scale-95"
          title={valoresVisiveis ? 'Ocultar valores' : 'Mostrar valores'}
        >
          {valoresVisiveis ? (
            <Eye className="text-gray-600" size={16} />
          ) : (
            <EyeOff className="text-gray-600" size={16} />
          )}
        </button>

        {/* Botão do perfil */}
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-300/70 rounded-2xl transition-all duration-200 shadow-lg transform active:scale-95 overflow-hidden flex items-center justify-center touch-manipulation"
        >
          {user?.user_metadata?.picture ? (
            <img
              src={user.user_metadata.picture}
              alt={user.user_metadata.name || 'Usuário'}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="text-gray-600" size={16} />
          )}
        </button>

        {/* Dropdown do usuário */}
        {showUserMenu && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-scale-in z-50">
            {/* Overlay para fechar */}
            <div
              className="fixed inset-0 z-40 bg-transparent"
              onClick={() => setShowUserMenu(false)}
            />

            <div className="relative z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  {user?.user_metadata?.name || user?.email || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500 break-words">{user?.email}</p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
