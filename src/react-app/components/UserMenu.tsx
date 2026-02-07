import { useState, useEffect } from 'react';
import { User, LogOut, Eye, EyeOff, Camera } from 'lucide-react';
import { supabase } from '@/react-app/supabaseClient';
import { useValoresVisiveis } from '@/react-app/hooks/useValoresVisiveis';
import ProfileEditorModal from './ProfileEditorModal';

export default function UserMenu() {
  const [user, setUser] = useState<any>(null);
  const { valoresVisiveis, toggleValoresVisiveis } = useValoresVisiveis();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.replace('/login');
  };

  const handleProfileUpdate = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
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
          className="w-10 h-10 bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-300/70 rounded-2xl transition-all duration-200 shadow-lg transform active:scale-95 overflow-hidden flex items-center justify-center touch-manipulation relative group"
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
              <div className="px-4 py-3 border-b border-gray-100 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full overflow-hidden mb-2 relative group cursor-pointer" onClick={() => setIsProfileModalOpen(true)}>
                  {user?.user_metadata?.picture ? (
                    <img
                      src={user.user_metadata.picture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <User className="text-gray-400" size={32} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={20} />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900 text-center">
                  {user?.user_metadata?.name || user?.email || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500 break-words text-center">{user?.email}</p>

                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="mt-2 text-xs text-teal-600 hover:text-teal-700 font-medium hover:underline"
                >
                  Alterar foto
                </button>
              </div>

              <div className="mt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ProfileEditorModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onUpdate={handleProfileUpdate}
      />
    </div>
  );
}
