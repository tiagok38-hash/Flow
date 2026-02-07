import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/react-app/supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';

interface UseSupabaseQueryOptions {
    select?: string;
    filters?: Record<string, any>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    single?: boolean;
}

/**
 * Hook personalizado para buscar dados do Supabase.
 * 
 * @param table Nome da tabela
 * @param options Opções de consulta (select, filters, order, limit, single)
 * @returns { data, error, loading, refetch }
 */
export function useSupabaseQuery<T>(
    table: string,
    options: UseSupabaseQueryOptions = {}
) {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<PostgrestError | null>(null);

    // Memoizando as opções para evitar loops infinitos no useEffect
    const optionsKey = JSON.stringify(options);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase.from(table).select(options.select || '*');

            // Aplicar filtros de igualdade simples
            if (options.filters) {
                Object.entries(options.filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        query = query.eq(key, value);
                    }
                });
            }

            // Ordenação
            if (options.order) {
                query = query.order(options.order.column, {
                    ascending: options.order.ascending ?? true
                });
            }

            // Limite
            if (options.limit) {
                query = query.limit(options.limit);
            }

            // Executar a query
            // Se for single, usamos .single() ou .maybeSingle()
            if (options.single) {
                const { data: result, error: err } = await query.single();
                if (err) throw err;
                setData(result as T);
            } else {
                const { data: result, error: err } = await query;
                if (err) throw err;
                setData(result as unknown as T);
            }
        } catch (err: any) {
            console.error(`Erro no useSupabaseQuery [${table}]:`, err);
            setError(err as PostgrestError);
        } finally {
            setLoading(false);
        }
    }, [table, optionsKey]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, loading, error, refetch: fetchData };
}
