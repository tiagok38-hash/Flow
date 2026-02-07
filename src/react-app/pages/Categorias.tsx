import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingDown, ArrowLeft } from 'lucide-react';
import { useGastosPorCategoria, formatarMoeda } from '@/react-app/hooks/useApi';
import Card from '@/react-app/components/Card';
import FilterChips from '@/react-app/components/FilterChips';
import Icon from '@/react-app/components/Icon';
import { Link } from 'react-router';

// Cores inspiradas no Kinvo e app
const COLORS = [
  '#14B8A6', // teal-500
  '#06B6D4', // cyan-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#10B981', // emerald-500
  '#F97316', // orange-500
  '#EC4899', // pink-500
  '#6366F1', // indigo-500
  '#84CC16', // lime-500
];

export default function Categorias() {
  const [periodo, setPeriodo] = useState('mes-atual');
  const { data: gastosPorCategoria, loading } = useGastosPorCategoria(periodo);

  // Preparar dados para o gráfico de pizza
  const dadosGrafico = gastosPorCategoria?.map((item, index) => ({
    name: item.categoria_nome,
    value: item.total,
    color: COLORS[index % COLORS.length]
  })) || [];

  const total = gastosPorCategoria?.reduce((acc, item) => acc + item.total, 0) || 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentual = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 rounded-2xl shadow-lg border border-gray-100">
          <p className="font-medium text-gray-900">{data.payload.name}</p>
          <p className="text-teal-500 font-medium">{formatarMoeda(data.value)}</p>
          <p className="text-gray-500 text-sm">{percentual}% do total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/60 to-emerald-50/60 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-400 to-cyan-400 shadow-lg shadow-teal-500/25">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-light text-white">Gastos por Categoria</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Filtros */}
        <FilterChips selectedPeriodo={periodo} onPeriodoChange={setPeriodo} />

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
          </div>
        ) : gastosPorCategoria && gastosPorCategoria.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Lista de categorias */}
            <Card className="bg-white/70 backdrop-blur-sm shadow-xl shadow-gray-400/30">
              <h3 className="text-lg font-light text-gray-900 mb-6">Categorias Ordenadas</h3>
              
              <div className="space-y-4">
                {gastosPorCategoria.map((item, index) => {
                  const percentual = ((item.total / total) * 100).toFixed(1);
                  const cor = COLORS[index % COLORS.length];
                  
                  return (
                    <div key={item.categoria_id} className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl hover:bg-gray-100/50 transition-all duration-200">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 rounded-2xl bg-white shadow-sm">
                          <Icon name={item.categoria_icone} size={18} className="text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{item.categoria_nome}</p>
                          <p className="text-xs text-gray-500 font-light">{percentual}% do total</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm font-medium text-orange-500">
                          {formatarMoeda(item.total)}
                        </p>
                        <div 
                          className="w-3 h-3 rounded-full mt-1 ml-auto"
                          style={{ backgroundColor: cor }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="font-light text-gray-600">Total gasto</span>
                  <span className="text-lg font-medium text-orange-500">
                    {formatarMoeda(total)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Gráfico de pizza */}
            <Card className="bg-white/70 backdrop-blur-sm shadow-xl shadow-gray-400/30">
              <h3 className="text-lg font-light text-gray-900 mb-6">Distribuição Visual</h3>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosGrafico}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {dadosGrafico.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legenda personalizada */}
              <div className="grid grid-cols-1 gap-2 mt-4">
                {dadosGrafico.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-gray-600 truncate flex-1">
                      {item.name}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {((item.value / total) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
                {dadosGrafico.length > 5 && (
                  <div className="text-xs text-gray-400 mt-2">
                    +{dadosGrafico.length - 5} outras categorias
                  </div>
                )}
              </div>
            </Card>
          </div>
        ) : (
          <Card className="text-center py-16">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <TrendingDown className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-light text-gray-900 mb-2">
              Nenhum gasto encontrado
            </h3>
            <p className="text-gray-500 font-light">
              Nenhuma despesa foi encontrada no período selecionado
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
