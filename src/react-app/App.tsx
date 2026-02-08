import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router";
import { useEffect, useState } from 'react';
import { supabase } from '@/react-app/supabaseClient';
import { ValoresVisiveisProvider } from '@/react-app/hooks/useValoresVisiveis';
import Navigation from "@/react-app/components/Navigation";
import SyncManager from "@/react-app/components/SyncManager";
import Dashboard from "@/react-app/pages/Dashboard";
import Historico from "@/react-app/pages/Historico";
import Cartoes from "@/react-app/pages/Cartoes";
import Configuracoes from "@/react-app/pages/Configuracoes";
import RankingCategorias from "@/react-app/pages/RankingCategorias";

import Login from "@/react-app/pages/Login";

function ProtectedApp() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400"></div>
      </div>
    );
  }

  // Se não estiver logado, mostra o Login (exceto se a rota já for /login)
  // Mas como estamos usando React Router, podemos renderizar condicionalmente
  if (!session) {
    // Se o usuário tentar acessar qualquer rota protegida, redireciona pro login
    // Mas permitimos que o Router renderize a rota /login se for ela
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <ValoresVisiveisProvider>
      <SyncManager />
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-green-50">
        <Navigation />
        {/* Adiciona padding à esquerda no desktop para compensar a sidebar fixa */}
        <main className="lg:pl-64 min-h-screen transition-all duration-500 ease-in-out">
          <div className="animate-fade-in pb-32 lg:pb-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/historico" element={<Historico />} />
              <Route path="/cartoes" element={<Cartoes />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/ranking-categorias" element={<RankingCategorias />} />

              {/* Se logado tentar ir pra login, redireciona pra home */}
              <Route path="/login" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </ValoresVisiveisProvider>
  );
}

export default function App() {
  return (
    <Router>
      <ProtectedApp />
    </Router>
  );
}
