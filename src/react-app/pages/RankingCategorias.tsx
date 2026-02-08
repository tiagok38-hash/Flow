import { useState } from 'react';
import { ArrowLeft, Award, Trophy, PieChart, BarChart3 } from 'lucide-react';
import { Link } from 'react-router';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useGastosPorCategoria, formatarMoeda } from '@/react-app/hooks/useApi';
import Card from '@/react-app/components/Card';
import FilterChips from '@/react-app/components/FilterChips';
import Icon from '@/react-app/components/Icon';

// Cores para os gráficos
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

export default function RankingCategorias() {
  const [periodo, setPeriodo] = useState('mes-atual');
  const [tipoGrafico, setTipoGrafico] = useState<'pizza' | 'barras'>('pizza');
  const { data: gastosPorCategoria, loading } = useGastosPorCategoria(periodo);

  // Pegar apenas as top 3 categorias
  const top3Categorias = gastosPorCategoria?.slice(0, 3) || [];



  const getMedalColor = (posicao: number) => {
    switch (posicao) {
      case 1:
        return 'from-yellow-200 to-amber-300'; // Ouro mais claro
      case 2:
        return 'from-gray-200 to-gray-400'; // Prata mais claro
      case 3:
        return 'from-amber-300 to-orange-400'; // Bronze mais claro
      default:
        return 'from-gray-100 to-gray-300';
    }
  };

  const getNumberColor = (posicao: number) => {
    switch (posicao) {
      case 1:
        return 'text-yellow-600';
      case 2:
        return 'text-gray-600';
      case 3:
        return 'text-amber-700';
      default:
        return 'text-gray-600';
    }
  };

  const getPosicaoText = (posicao: number) => {
    switch (posicao) {
      case 1:
        return '1º Lugar';
      case 2:
        return '2º Lugar';
      case 3:
        return '3º Lugar';
      default:
        return `${posicao}º Lugar`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/60 to-emerald-50/60 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-teal-50/60 to-emerald-50/60 shadow-lg shadow-teal-500/25">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-2 text-gray-600/80 hover:text-gray-800 hover:bg-white/20 rounded-xl transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-xl font-light text-gray-900">Ranking de categorias (despesas)</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Filtros */}
        <FilterChips selectedPeriodo={periodo} onPeriodoChange={setPeriodo} />

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
          </div>
        ) : top3Categorias.length > 0 ? (
          <div className="space-y-8">
            {/* Pódio das top 3 - Card único */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl shadow-gray-400/30 animate-slide-up max-w-4xl mx-auto">
              <h3 className="text-lg font-light text-gray-900 mb-6 text-center">Top 3 Categorias</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                {top3Categorias.map((categoria, index) => {
                  const posicao = index + 1;
                  const medalColor = getMedalColor(posicao);
                  const numberColor = getNumberColor(posicao);

                  return (
                    <div
                      key={categoria.categoria_id}
                      className={`relative overflow-hidden bg-gray-50/70 rounded-2xl sm:rounded-3xl p-3 sm:p-6 transition-all duration-300 hover:scale-[1.02] animate-slide-up ${posicao === 1 ? 'sm:order-2 ring-2 ring-yellow-400/50 bg-yellow-50/70' :
                        posicao === 2 ? 'sm:order-1' : 'sm:order-3'
                        }`}
                      style={{
                        animationDelay: `${index * 150}ms`
                      }}
                    >
                      {/* Conteúdo principal */}
                      <div className="text-center">
                        {/* Ícone da medalha */}
                        <div className="flex justify-center mb-2 sm:mb-3">
                          <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br ${medalColor} shadow-md`}>
                            {posicao === 1 ? <Trophy className="text-yellow-600" size={18} /> :
                              posicao === 2 ? <Trophy className="text-gray-600" size={18} /> :
                                <Trophy className="text-amber-700" size={18} />}
                          </div>
                        </div>

                        {/* Posição */}
                        <div className="mb-2 sm:mb-3">
                          <span className={`text-xs sm:text-sm font-medium ${numberColor}`}>
                            {getPosicaoText(posicao)}
                          </span>
                        </div>

                        {/* Ícone da categoria */}
                        <div className="flex justify-center mb-2 sm:mb-3">
                          <div className="p-1.5 sm:p-2 bg-white rounded-lg sm:rounded-xl shadow-sm">
                            <Icon
                              name={categoria.categoria_icone}
                              size={16}
                              className="text-gray-600"
                            />
                          </div>
                        </div>

                        {/* Nome da categoria */}
                        <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-1 sm:mb-2">
                          {categoria.categoria_nome}
                        </h4>

                        {/* Valor gasto */}
                        <div className="text-center">
                          <p className="text-sm sm:text-lg font-bold text-orange-500 mb-1">
                            {formatarMoeda(categoria.total)}
                          </p>

                          {/* Percentual do total */}
                          {gastosPorCategoria && gastosPorCategoria.length > 1 && (
                            <p className="text-xs text-gray-500 font-light">
                              {((categoria.total / gastosPorCategoria.reduce((acc, cat) => acc + cat.total, 0)) * 100).toFixed(1)}% do total
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Decoração especial para o 1º lugar */}
                      {posicao === 1 && (
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-100/30 to-amber-100/30 pointer-events-none rounded-3xl" />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Card com gráficos */}
            <Card className="bg-white/70 backdrop-blur-sm shadow-xl shadow-gray-400/30 animate-slide-up-delay-1">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-light text-gray-900">Visualização por Categoria</h3>

                {/* Toggle entre pizza e barras */}
                <div className="flex bg-gray-100 rounded-2xl p-1">
                  <button
                    onClick={() => setTipoGrafico('pizza')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${tipoGrafico === 'pizza'
                      ? 'bg-white text-teal-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                      }`}
                  >
                    <PieChart size={16} />
                    Pizza
                  </button>
                  <button
                    onClick={() => setTipoGrafico('barras')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${tipoGrafico === 'barras'
                      ? 'bg-white text-teal-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                      }`}
                  >
                    <BarChart3 size={16} />
                    Barras
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
                </div>
              ) : gastosPorCategoria && gastosPorCategoria.length > 0 ? (
                <div className={`${tipoGrafico === 'pizza' ? 'h-auto min-h-[320px]' : 'h-80'}`}>
                  {tipoGrafico === 'pizza' ? (
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-4">
                      {/* Gráfico de Pizza */}
                      <div className="w-full md:w-1/2 h-64 sm:h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={gastosPorCategoria.map((item, index) => ({
                                name: item.categoria_nome,
                                value: item.total,
                                color: COLORS[index % COLORS.length]
                              }))}
                              cx="50%"
                              cy="50%"
                              innerRadius={65}
                              outerRadius={100}
                              paddingAngle={4}
                              dataKey="value"
                              stroke="none"
                            >
                              {gastosPorCategoria.map((_, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                  className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0];
                                  const total = gastosPorCategoria.reduce((acc, item) => acc + item.total, 0);
                                  const percentual = ((data.value / total) * 100).toFixed(1);
                                  const categoria = gastosPorCategoria.find(cat => cat.categoria_nome === data.payload.name);

                                  return (
                                    <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-gray-100 min-w-[200px] animate-fade-in">
                                      <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 rounded-xl bg-gray-50 shadow-sm">
                                          <Icon name={categoria?.categoria_icone || 'circle'} size={16} className="text-gray-600" />
                                        </div>
                                        <p className="font-bold text-gray-900 text-sm tracking-tight">{data.payload.name}</p>
                                      </div>

                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <span className="text-xs text-gray-500 font-light tracking-wide">Valor gasto</span>
                                          <span className="text-orange-500 font-bold text-sm">{formatarMoeda(data.value)}</span>
                                        </div>

                                        <div className="flex justify-between items-center">
                                          <span className="text-xs text-gray-500 font-light tracking-wide">Participação</span>
                                          <span className="text-teal-600 font-semibold text-sm">{percentual}%</span>
                                        </div>

                                        <div className="pt-2">
                                          <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                            <div
                                              className="bg-gradient-to-r from-orange-400 to-red-400 h-full rounded-full transition-all duration-500"
                                              style={{ width: `${percentual}%` }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Legenda Customizada */}
                      <div className="w-full md:w-1/2 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {gastosPorCategoria.map((item, index) => (
                          <div
                            key={`legenda-${index}`}
                            className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-2xl hover:bg-white hover:shadow-md transition-all duration-200 border border-transparent hover:border-gray-100 group"
                          >
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm group-hover:scale-125 transition-transform"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-0.5 truncate leading-tight">
                                {item.categoria_nome}
                              </p>
                              <p className="text-sm font-bold text-gray-900 leading-tight">
                                {formatarMoeda(item.total)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={gastosPorCategoria.map((item, index) => ({
                          name: item.categoria_nome,
                          valor: item.total,
                          color: COLORS[index % COLORS.length]
                        }))}
                        margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
                        barSize={32}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 300 }}
                          axisLine={false}
                          tickLine={false}
                          dy={15}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 300 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(value) => value >= 1000 ? `R$ ${(value / 1000).toFixed(0)}k` : `R$ ${value}`}
                          dx={-10}
                        />
                        <Tooltip
                          cursor={{ fill: '#f8fafc', radius: 12 }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0];
                              return (
                                <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-gray-100 animate-fade-in min-w-[140px]">
                                  <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">{data.payload.name}</p>
                                  <p className="text-sm font-bold text-orange-500">{formatarMoeda(data.value)}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar
                          dataKey="valor"
                          radius={[8, 8, 8, 8]}
                          className="transition-all duration-300"
                        >
                          {gastosPorCategoria.map((_, index) => (
                            <Cell
                              key={`bar-cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                              className="hover:opacity-80"
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                    <Award className="text-gray-400" size={32} />
                  </div>
                  <h3 className="text-xl font-light text-gray-900 mb-2">
                    Nenhum gasto encontrado
                  </h3>
                  <p className="text-gray-500 font-light">
                    Nenhuma despesa foi encontrada no período selecionado
                  </p>
                </div>
              )}
            </Card>

            {/* Lista completa das demais categorias */}
            {gastosPorCategoria && gastosPorCategoria.length > 3 && (
              <Card className="bg-white/70 backdrop-blur-sm shadow-xl shadow-gray-400/30 animate-slide-up-delay-2">
                <h3 className="text-lg font-light text-gray-900 mb-6">Outras Categorias</h3>

                <div className="space-y-4">
                  {gastosPorCategoria.slice(3).map((categoria, index) => {
                    const posicao = index + 4;

                    return (
                      <div key={categoria.categoria_id} className="flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl hover:bg-gray-100/50 transition-all duration-200">
                        <div className="flex items-center gap-4 flex-1">
                          {/* Posição */}
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">{posicao}</span>
                          </div>

                          {/* Ícone da categoria */}
                          <div className="p-3 rounded-2xl bg-white shadow-sm">
                            <Icon name={categoria.categoria_icone} size={18} className="text-gray-600" />
                          </div>

                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{categoria.categoria_nome}</p>
                            <p className="text-xs text-gray-500 font-light">
                              {((categoria.total / gastosPorCategoria.reduce((acc, cat) => acc + cat.total, 0)) * 100).toFixed(1)}% do total
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-medium text-orange-500">
                            {formatarMoeda(categoria.total)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Resumo total */}
            <Card className="bg-white/70 backdrop-blur-sm shadow-xl shadow-gray-400/30 animate-slide-up-delay-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-light text-gray-900 mb-2">Total Geral</h3>
                  <p className="text-sm text-gray-500 font-light">
                    Soma de todas as categorias no período
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-orange-500">
                    {formatarMoeda(gastosPorCategoria?.reduce((acc, cat) => acc + cat.total, 0) || 0)}
                  </p>
                  <p className="text-sm text-gray-500 font-light">
                    {gastosPorCategoria?.length || 0} categorias
                  </p>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="text-center py-16 animate-slide-up">
            <div className="p-6 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Award className="text-gray-400" size={32} />
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
