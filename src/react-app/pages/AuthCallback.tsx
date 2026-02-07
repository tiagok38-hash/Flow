import { useEffect, useState } from 'react';
import { useAuth } from '@getmocha/users-service/react';

export default function AuthCallback() {
  const { exchangeCodeForSessionToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processAuth = async () => {
      try {
        await exchangeCodeForSessionToken();
        // Redireciona para o dashboard após login bem-sucedido
        window.location.href = '/';
      } catch (err) {
        console.error('Erro no processo de autenticação:', err);
        setError('Erro ao fazer login. Tente novamente.');
      }
    };

    processAuth();
  }, [exchangeCodeForSessionToken]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100/50 p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <div className="w-8 h-8 bg-red-500 rounded-full"></div>
            </div>
            <h2 className="text-xl font-light text-gray-900 mb-2">Erro de autenticação</h2>
            <p className="text-gray-500 font-light mb-6">{error}</p>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-6 py-3 bg-gradient-to-r from-teal-400 to-cyan-400 text-white rounded-2xl font-light hover:from-teal-500 hover:to-cyan-500 transition-all"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-25 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"></div>
        <p className="text-gray-600 font-light">Processando login...</p>
      </div>
    </div>
  );
}
