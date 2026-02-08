import { useState } from 'react';
import { Calendar } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface FilterChipsProps {
  selectedPeriodo: string;
  onPeriodoChange: (periodo: string) => void;
}

export default function FilterChips({ selectedPeriodo, onPeriodoChange }: FilterChipsProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);

  const periodos = [
    { key: 'hoje', label: 'Hoje' },
    { key: 'semana', label: 'Esta Semana' },
    { key: 'mes-atual', label: 'Este Mês' },
  ];

  const handleDateRangeChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setTempStartDate(start);
    setTempEndDate(end);
  };

  const handleConfirmDateRange = () => {
    if (tempStartDate && tempEndDate) {
      setStartDate(tempStartDate);
      setEndDate(tempEndDate);
      const startStr = tempStartDate.toISOString().split('T')[0];
      const endStr = tempEndDate.toISOString().split('T')[0];
      onPeriodoChange(`custom:${startStr}:${endStr}`);
      setShowDatePicker(false);
    }
  };

  const handleCancelDateRange = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setShowDatePicker(false);
  };

  const isCustomPeriod = selectedPeriodo.startsWith('custom:');

  return (
    <div className="flex items-center gap-4 mb-8 mt-2 animate-fade-in">
      <div className="flex gap-2 flex-1 flex-wrap">
        {periodos.map((periodo) => (
          <button
            key={periodo.key}
            onClick={() => onPeriodoChange(periodo.key)}
            className={`flex-1 px-4 py-2 rounded-2xl text-sm font-light transition-all duration-200 hover:scale-105 whitespace-nowrap flex justify-center items-center ${selectedPeriodo === periodo.key
              ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-white shadow-lg shadow-teal-500/25'
              : 'bg-white/60 text-gray-600 hover:bg-white hover:shadow-md border border-gray-300/70'
              }`}
          >
            {periodo.label}
          </button>
        ))}

        {/* Ícone de calendário clicável - sempre visível */}
        <button
          onClick={() => setShowDatePicker(true)}
          className={`px-4 py-2 rounded-2xl transition-all duration-200 hover:scale-105 flex items-center justify-center ${isCustomPeriod
            ? 'bg-gradient-to-r from-teal-400 to-cyan-400 text-white shadow-lg shadow-teal-500/25'
            : 'bg-white/60 text-gray-600 hover:bg-white hover:shadow-md border border-gray-300/70'
            }`}
          title="Selecionar período personalizado"
        >
          <Calendar size={16} />
        </button>
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black bg-opacity-50 animate-fade-in"
            onClick={handleCancelDateRange}
          />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full border border-gray-100 animate-scale-in transform transition-all duration-300 ease-out">
            <h3 className="text-lg font-light text-gray-900 mb-4">Selecionar Período</h3>
            <div className="datepicker-custom">
              <DatePicker
                selected={tempStartDate}
                onChange={handleDateRangeChange}
                startDate={tempStartDate}
                endDate={tempEndDate}
                selectsRange
                inline
                dateFormat="dd/MM/yyyy"
                locale="pt-BR"
                className="w-full transition-all duration-200"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCancelDateRange}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-light hover:scale-105 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDateRange}
                disabled={!tempStartDate || !tempEndDate}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-teal-400 to-cyan-400 text-white rounded-xl hover:from-teal-500 hover:to-cyan-500 transition-all duration-200 font-light disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shadow-lg shadow-teal-500/25"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom DatePicker Styles */}
      <style>{`
        .datepicker-custom .react-datepicker {
          border: none !important;
          box-shadow: none !important;
          font-family: inherit !important;
          border-radius: 16px !important;
          transition: all 0.3s ease !important;
        }
        
        .datepicker-custom .react-datepicker__header {
          background-color: #f9fafb !important;
          border-bottom: 1px solid #e5e7eb !important;
          border-radius: 16px 16px 0 0 !important;
          padding: 16px !important;
        }
        
        .datepicker-custom .react-datepicker__current-month {
          color: #374151 !important;
          font-weight: 400 !important;
          font-size: 16px !important;
        }
        
        .datepicker-custom .react-datepicker__day-name {
          color: #6b7280 !important;
          font-weight: 400 !important;
          margin: 4px !important;
        }
        
        .datepicker-custom .react-datepicker__day {
          color: #374151 !important;
          font-weight: 400 !important;
          margin: 4px !important;
          border-radius: 8px !important;
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
          transition: all 0.2s ease !important;
        }
        
        .datepicker-custom .react-datepicker__day:hover {
          background-color: #f0fdfa !important;
          color: #0d9488 !important;
          transform: scale(1.1) !important;
        }
        
        .datepicker-custom .react-datepicker__day--selected,
        .datepicker-custom .react-datepicker__day--in-selecting-range,
        .datepicker-custom .react-datepicker__day--in-range {
          background-color: #14b8a6 !important;
          color: white !important;
          transform: scale(1.05) !important;
          animation: pulseSelection 0.3s ease !important;
        }
        
        .datepicker-custom .react-datepicker__day--range-start,
        .datepicker-custom .react-datepicker__day--range-end {
          background-color: #0d9488 !important;
          color: white !important;
          transform: scale(1.1) !important;
          animation: pulseSelection 0.5s ease !important;
        }
        
        .datepicker-custom .react-datepicker__navigation {
          border: none !important;
          outline: none !important;
          transition: all 0.2s ease !important;
        }
        
        .datepicker-custom .react-datepicker__navigation:hover {
          transform: scale(1.1) !important;
        }
        
        .datepicker-custom .react-datepicker__navigation--previous {
          left: 16px !important;
          top: 20px !important;
        }
        
        .datepicker-custom .react-datepicker__navigation--next {
          right: 16px !important;
          top: 20px !important;
        }
        
        .datepicker-custom .react-datepicker__triangle {
          display: none !important;
        }
        
        @keyframes pulseSelection {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1.05); }
        }
        
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out;
        }
        
        @keyframes scaleIn {
          0% { 
            transform: scale(0.8) translateY(-20px); 
            opacity: 0; 
          }
          100% { 
            transform: scale(1) translateY(0); 
            opacity: 1; 
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
