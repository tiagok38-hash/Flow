import { useCallback } from 'react';

export function useCurrencyFormat() {
  const formatCurrency = useCallback((value: string): string => {
    // Remove tudo que não é dígito
    let numericValue = value.replace(/[^\d]/g, '');
    
    if (!numericValue) return '';
    
    // Converte para número (centavos)
    const cents = parseInt(numericValue);
    
    // Converte para reais
    const reais = cents / 100;
    
    // Formata para o padrão brasileiro
    return reais.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }, []);

  const parseCurrency = useCallback((formattedValue: string): number => {
    // Remove pontos e substitui vírgula por ponto
    const numericString = formattedValue.replace(/\./g, '').replace(',', '.');
    return parseFloat(numericString) || 0;
  }, []);

  const formatInputValue = useCallback((inputValue: string): string => {
    // Remove tudo que não é dígito
    const numericValue = inputValue.replace(/[^\d]/g, '');
    
    if (!numericValue) return '';
    
    // Converte para centavos
    const cents = parseInt(numericValue);
    
    // Formata com separadores brasileiros
    const reais = cents / 100;
    return reais.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }, []);

  return { formatCurrency, parseCurrency, formatInputValue };
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}
