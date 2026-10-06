import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useFinanceData } from "@/hooks/use-finance-data";
import { api } from "@/lib/api";
import React from "react";

// Mock do módulo api
vi.mock("@/lib/api", () => ({
  api: {
    createTransaction: vi.fn(),
    getTransactions: vi.fn(),
    getAccounts: vi.fn(),
    getBudgets: vi.fn(),
    getCategories: vi.fn(),
  },
}));

// Mock do AuthContext
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/contexts/AuthContext";

const mockUser = { id: "user123", name: "User", email: "user@example.com" };

// Helper para renderizar o hook
const renderUseFinanceData = () => {
  return renderHook(() => useFinanceData());
};

describe("useFinanceData hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });
  });

  it("should send recurrenceType, installmentTotal and isPaid to API and update state with returned installments", async () => {
    // Preparar os mocks da API
    const mockTxToCreate = {
      description: "Compra Parcelada",
      amount: 300,
      type: "expense" as const,
      category: "Compras",
      date: "2023-10-01",
      accountId: "acc1",
      paymentMethod: "credit_card",
      account: "acc1",
      isPaid: true,
      recurrenceType: "INSTALLMENT" as const,
      installmentTotal: 3,
    };

    // O backend retorna as parcelas
    const mockReturnedInstallments = [
      { id: "tx1", ...mockTxToCreate, amount: 100, installmentCurrent: 1 },
      { id: "tx2", ...mockTxToCreate, amount: 100, installmentCurrent: 2, date: "2023-11-01" },
      { id: "tx3", ...mockTxToCreate, amount: 100, installmentCurrent: 3, date: "2023-12-01" },
    ];

    (api.getTransactions as any).mockResolvedValueOnce([]);
    (api.getAccounts as any).mockResolvedValueOnce([]);
    (api.getBudgets as any).mockResolvedValueOnce([]);
    (api.getCategories as any).mockResolvedValueOnce([]);
    
    const { result } = renderUseFinanceData();

    // Aguardar carregamento inicial
    await act(async () => {
      await Promise.resolve();
    });

    // Simula API getTransactions retornando as parcelas após criação
    (api.getTransactions as any).mockResolvedValueOnce(mockReturnedInstallments);
    (api.getAccounts as any).mockResolvedValueOnce([]);

    await act(async () => {
      await result.current.addTransaction(mockTxToCreate);
    });

    expect(api.createTransaction).toHaveBeenCalledWith(mockTxToCreate);
    expect(api.createTransaction).toHaveBeenCalledTimes(1);

    // O estado de allTransactions deve ser atualizado com as parcelas retornadas
    expect(result.current.allTransactions).toHaveLength(3);
    expect(result.current.allTransactions).toEqual(mockReturnedInstallments);
  });
});
