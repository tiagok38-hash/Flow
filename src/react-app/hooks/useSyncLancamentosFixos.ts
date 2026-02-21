import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/react-app/supabaseClient';
import { getDataStringBrasil } from '@/react-app/hooks/useApi';

export function useSyncLancamentosFixos() {
    const isSyncingRef = useRef(false);

    const sync = useCallback(async () => {
        if (isSyncingRef.current) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        isSyncingRef.current = true;

        try {
            // Buscar lançamentos fixos do usuário
            const { data: fixos, error } = await supabase
                .from('lancamentos_fixos')
                .select('*');

            if (error || !fixos) return;

            const hojeStr = getDataStringBrasil();
            const hoje = new Date(hojeStr + 'T00:00:00');

            for (const fixo of fixos) {
                // Se o último processamento foi hoje, pula este lançamento fixo
                if (fixo.ultimo_processamento === hojeStr) continue;

                // Data de partida para o processamento
                let dataPartidaStr = fixo.ultimo_processamento || fixo.created_at.split('T')[0];
                let dataPartida = new Date(dataPartidaStr + 'T00:00:00');

                // Se já foi processado anteriormente, começamos a verificar a partir do dia seguinte
                if (fixo.ultimo_processamento) {
                    dataPartida.setDate(dataPartida.getDate() + 1);
                }

                const lancamentosParaCriar = [];
                let dataIteracao = new Date(dataPartida);

                while (dataIteracao <= hoje) {
                    const dia = dataIteracao.getDate();
                    const mes = dataIteracao.getMonth() + 1;
                    const ano = dataIteracao.getFullYear();
                    const diaSemana = dataIteracao.getDay(); // 0-6
                    const dataIteracaoStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

                    let deveGerar = false;

                    switch (fixo.periodicidade) {
                        case 'diario':
                            deveGerar = true;
                            break;
                        case 'semanal':
                            if (diaSemana === fixo.dia_semana) deveGerar = true;
                            break;
                        case 'quinzenal':
                            if (dia === fixo.dia_mes_1 || dia === fixo.dia_mes_2) deveGerar = true;
                            break;
                        case 'mensal':
                            if (dia === fixo.dia_mes_1) deveGerar = true;
                            break;
                    }

                    if (deveGerar) {
                        lancamentosParaCriar.push({
                            user_id: user.id,
                            tipo: fixo.tipo,
                            descricao: fixo.nome,
                            categoria_id: fixo.categoria_id,
                            valor: fixo.tipo === 'despesa' ? -Math.abs(fixo.valor) : Math.abs(fixo.valor),
                            data: dataIteracaoStr,
                            forma_pagamento: 'Pix', // Padrão para fixos automáticos
                            status: 'pago',
                            competencia: dataIteracaoStr.substring(0, 7),
                        });
                    }

                    dataIteracao.setDate(dataIteracao.getDate() + 1);
                }

                if (lancamentosParaCriar.length > 0) {
                    // Antes de inserir, vamos fazer um último check para ver se o ultimo_processamento não mudou
                    // (previne race conditions entre abas/instâncias)
                    const { data: fixoAtualizado } = await supabase
                        .from('lancamentos_fixos')
                        .select('ultimo_processamento')
                        .eq('id', fixo.id)
                        .single();

                    if (fixoAtualizado?.ultimo_processamento === hojeStr) {
                        continue;
                    }

                    const { error: insertError } = await supabase
                        .from('lancamentos')
                        .insert(lancamentosParaCriar);

                    if (insertError) {
                        console.error(`Erro ao inserir lançamentos para ${fixo.nome}:`, insertError);
                        continue;
                    }
                }

                // Atualiza o último processamento
                await supabase
                    .from('lancamentos_fixos')
                    .update({ ultimo_processamento: hojeStr })
                    .eq('id', fixo.id);
            }

            if (fixos.length > 0) {
                window.dispatchEvent(new CustomEvent('financeDataUpdated'));
            }
        } catch (err) {
            console.error('Erro no sync de lançamentos fixos:', err);
        } finally {
            isSyncingRef.current = false;
        }
    }, []);

    useEffect(() => {
        sync();
        const handleFocus = () => sync();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [sync]);

    return { sync };
}
