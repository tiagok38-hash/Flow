import { useState, useEffect, useMemo } from 'react';

// Cache com estratégia mais agressiva para carregamento rápido
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5000; // 5 segundos para dados críticos
const pendingRequests = new Map<string, Promise<any>>();

// Preload automático para dados essenciais
const criticalEndpoints = [
  '/api/dashboard/stats',
  '/api/categorias', 
  '/api/cartoes',
  '/api/lancamentos?periodo=mes-atual'
];

// Função para preload inteligente
const preloadCriticalData = async () => {
  criticalEndpoints.forEach(async (endpoint) => {
    if (!cache.has(endpoint)) {
      try {
        const response = await fetch(endpoint, { credentials: 'include' });
        if (response.ok) {
          const result = await response.json();
          cache.set(endpoint, { data: result, timestamp: Date.now() });
        }
      } catch (error) {
        // Ignorar erros de preload
      }
    }
  });
};

// Preload inicial na primeira carga
let preloadInitialized = false;
if (!preloadInitialized) {
  preloadCriticalData();
  preloadInitialized = true;
}

export function useOptimizedApi<T>(url: string, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = useMemo(() => `${url}-${JSON.stringify(deps)}`, [url, deps]);

  const fetchData = async () => {
    try {
      // Verificar cache primeiro (mais agressivo)
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setData(cached.data);
        setLoading(false);
        return;
      }

      // Verificar se já existe requisição pendente
      if (pendingRequests.has(url)) {
        const result = await pendingRequests.get(url);
        setData(result);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      // Criar promise otimizada
      const requestPromise = fetch(`${url}?_t=${Date.now()}`, {
        credentials: 'include'
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        return response.json();
      });
      
      pendingRequests.set(url, requestPromise);
      
      try {
        const result = await requestPromise;
        
        // Salvar no cache
        cache.set(cacheKey, { data: result, timestamp: Date.now() });
        
        setData(result);
      } finally {
        pendingRequests.delete(url);
      }
    } catch (err) {
      console.error(`Error fetching ${url}:`, err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      pendingRequests.delete(url);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, deps);

  // Escutar eventos de atualização (mais rápido)
  useEffect(() => {
    const handleDataUpdate = () => {
      const relatedKeys = Array.from(cache.keys()).filter(key => 
        key.includes(url.split('?')[0])
      );
      relatedKeys.forEach(key => cache.delete(key));
      
      // Update mais rápido
      setTimeout(() => fetchData(), 20);
    };

    window.addEventListener('financeDataUpdated', handleDataUpdate);
    
    return () => {
      window.removeEventListener('financeDataUpdated', handleDataUpdate);
    };
  }, [cacheKey, url]);

  const refetch = () => {
    cache.delete(cacheKey);
    fetchData();
  };

  return { data, loading, error, refetch };
}
