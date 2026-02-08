import { useSyncLancamentosFixos } from '@/react-app/hooks/useSyncLancamentosFixos';

export default function SyncManager() {
    // O hook useSyncLancamentosFixos já executa o sync automaticamente no useEffect
    useSyncLancamentosFixos();

    return null; // Este componente não renderiza nada, apenas gerencia a lógica de sincronização
}
