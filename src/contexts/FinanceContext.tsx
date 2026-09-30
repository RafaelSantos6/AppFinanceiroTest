import { createContext, useContext, ReactNode } from "react";
import { useFinanceData } from "@/hooks/use-finance-data";

type FinanceContextType = ReturnType<typeof useFinanceData>;

const FinanceContext = createContext<FinanceContextType | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const data = useFinanceData();
  return <FinanceContext.Provider value={data}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
