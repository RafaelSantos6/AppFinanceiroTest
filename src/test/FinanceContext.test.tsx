import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FinanceProvider, useFinance } from "@/contexts/FinanceContext";
import React from "react";
import * as useFinanceDataModule from "@/hooks/use-finance-data";

describe("FinanceContext", () => {
  it("should provide data from useFinanceData hook", () => {
    // Spy and mock return
    vi.spyOn(useFinanceDataModule, "useFinanceData").mockReturnValue({
      transactions: [],
      allTransactions: [],
      selectedMonth: "2023-10",
      setSelectedMonth: vi.fn(),
      accounts: [],
      budgets: [],
      categories: [],
      totalIncome: 100,
      totalExpenses: 50,
      balance: 50,
      isLoading: false,
      refetchFinanceData: vi.fn(),
      addTransaction: vi.fn(),
      updateTransaction: vi.fn(),
      deleteTransaction: vi.fn(),
      addAccount: vi.fn(),
      updateAccount: vi.fn(),
      deleteAccount: vi.fn(),
      addBudget: vi.fn(),
      updateBudget: vi.fn(),
      deleteBudget: vi.fn(),
      addCategory: vi.fn(),
      deleteCategory: vi.fn(),
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FinanceProvider>{children}</FinanceProvider>
    );

    const { result } = renderHook(() => useFinance(), { wrapper });

    expect(result.current.selectedMonth).toBe("2023-10");
    expect(result.current.balance).toBe(50);
  });

  it("should throw if used outside of FinanceProvider", () => {
    const origError = console.error;
    console.error = vi.fn(); // suppress React unhandled error warning
    expect(() => renderHook(() => useFinance())).toThrow("useFinance must be used within FinanceProvider");
    console.error = origError;
  });
});

