import { createContext, useContext, useState, ReactNode } from 'react';

interface ValoresVisiveisContextType {
  valoresVisiveis: boolean;
  toggleValoresVisiveis: () => void;
}

const ValoresVisiveisContext = createContext<ValoresVisiveisContextType | undefined>(undefined);

export function ValoresVisiveisProvider({ children }: { children: ReactNode }) {
  const [valoresVisiveis, setValoresVisiveis] = useState(true);

  const toggleValoresVisiveis = () => {
    setValoresVisiveis(!valoresVisiveis);
  };

  return (
    <ValoresVisiveisContext.Provider value={{ valoresVisiveis, toggleValoresVisiveis }}>
      {children}
    </ValoresVisiveisContext.Provider>
  );
}

export function useValoresVisiveis() {
  const context = useContext(ValoresVisiveisContext);
  if (!context) {
    throw new Error('useValoresVisiveis deve ser usado dentro de ValoresVisiveisProvider');
  }
  return context;
}
