import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { formatarMoeda } from '@/react-app/hooks/useApi';

interface AlertaLimiteProps {
  categoria: string;
  valor: number;
  limite: number;
  percentual: number;
}

export default function AlertaLimite({ categoria, valor, limite, percentual }: AlertaLimiteProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Mostrar alerta com delay para animação
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
    // Remover do DOM após animação
    setTimeout(() => {
      const element = document.getElementById(`alerta-${categoria}`);
      if (element) {
        element.remove();
      }
    }, 300);
  };

  const getAlertColor = () => {
    if (percentual >= 100) return 'from-red-50 to-red-100 border-red-200';
    if (percentual >= 90) return 'from-orange-50 to-orange-100 border-orange-200';
    return 'from-yellow-50 to-yellow-100 border-yellow-200';
  };

  const getIconColor = () => {
    if (percentual >= 100) return 'text-red-500';
    if (percentual >= 90) return 'text-orange-500';
    return 'text-yellow-500';
  };

  const getTextColor = () => {
    if (percentual >= 100) return 'text-red-800';
    if (percentual >= 90) return 'text-orange-800';
    return 'text-yellow-800';
  };

  const getMessage = () => {
    if (percentual >= 100) {
      return `Limite da categoria "${categoria}" foi ultrapassado!`;
    }
    if (percentual >= 90) {
      return `Atenção: você atingiu ${percentual.toFixed(0)}% do limite de "${categoria}"`;
    }
    return `Você está próximo do limite de "${categoria}" (${percentual.toFixed(0)}%)`;
  };

  return (
    <div
      id={`alerta-${categoria}`}
      className={`fixed top-4 right-4 z-50 max-w-sm transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`bg-gradient-to-r ${getAlertColor()} border rounded-2xl p-4 shadow-lg`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`${getIconColor()} flex-shrink-0 mt-0.5`} size={20} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${getTextColor()}`}>
              {getMessage()}
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className={getTextColor()}>Gasto atual:</span>
                <span className={`font-medium ${getTextColor()}`}>
                  {formatarMoeda(valor)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className={getTextColor()}>Limite:</span>
                <span className={`font-medium ${getTextColor()}`}>
                  {formatarMoeda(limite)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`p-1 rounded-lg hover:bg-black/10 transition-colors ${getTextColor()}`}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
