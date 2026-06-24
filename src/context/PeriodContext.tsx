import React, { createContext, useContext, useState, ReactNode } from 'react';

export type MonthValue = 'Todos' | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11';

interface PeriodContextData {
  selectedYear: string;
  selectedMonth: MonthValue;
  setYear: (year: string) => void;
  setMonth: (month: MonthValue) => void;
  availableYears: string[];
}

const PeriodContext = createContext<PeriodContextData | undefined>(undefined);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setYear] = useState<string>(currentYear);
  const [selectedMonth, setMonth] = useState<MonthValue>('Todos');

  // Compute available years (from 2024 to currentYear + 1)
  const baseYear = 2024;
  const maxYear = new Date().getFullYear();
  const availableYears = Array.from(
    { length: maxYear - baseYear + 2 },
    (_, i) => (baseYear + i).toString()
  ).reverse();

  return (
    <PeriodContext.Provider
      value={{
        selectedYear,
        selectedMonth,
        setYear,
        setMonth,
        availableYears,
      }}
    >
      {children}
    </PeriodContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePeriod() {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error('usePeriod must be used within a PeriodProvider');
  }
  return context;
}
