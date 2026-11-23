import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Dashboard from "@/pages/Dashboard";
import { ParentalControlSection } from "@/components/ParentalControlSection";
import { useFinance } from "@/contexts/FinanceContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/contexts/FinanceContext", () => ({
  useFinance: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    api: {
      ...actual.api,
      getChildren: vi.fn(),
      createChildAccount: vi.fn(),
      getChildOverview: vi.fn(),
      deleteChildAccount: vi.fn(),
    },
  };
});

describe("Parental Control Feature (Settings + Dashboard Switcher)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    (useAuth as any).mockReturnValue({
      user: { id: "parent-1", name: "Rafael", email: "rafael@exemplo.com", role: "ADULT" },
      logout: vi.fn(),
    });

    (useFinance as any).mockReturnValue({
      transactions: [],
      totalIncome: 5000,
      totalExpenses: 1200,
      balance: 3800,
      accounts: [],
      budgets: [],
      goals: [],
      selectedMonth: "2026-03",
    });
  });

  it("allows parent to create a child account in Settings", async () => {
    (api.getChildren as any).mockResolvedValue([]);
    (api.createChildAccount as any).mockResolvedValue({
      child: {
        id: "child-1",
        name: "Lucas",
        email: "lucas@familia.com",
        role: "CHILD",
        parentId: "parent-1",
        spendingLimit: 150,
      },
      message: "Conta da criança criada com sucesso!",
    });

    render(
      <MemoryRouter>
        <ParentalControlSection />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Nova Conta de Criança/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Nova Conta de Criança/i }));

    fireEvent.change(screen.getByLabelText(/Nome da Criança/i), { target: { value: "Lucas" } });
    fireEvent.change(screen.getByLabelText(/E-mail de Login da Criança/i), {
      target: { value: "lucas@familia.com" },
    });
    fireEvent.change(screen.getByLabelText(/Senha de Acesso/i), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText(/Limite Mensal de Gastos/i), {
      target: { value: "150" },
    });

    fireEvent.click(screen.getByText(/Criar Conta da Criança/i));

    await waitFor(() => {
      expect(api.createChildAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Lucas",
          email: "lucas@familia.com",
          spendingLimit: 150,
        })
      );
      expect(screen.getByText("Lucas")).toBeInTheDocument();
      expect(screen.getByText("lucas@familia.com")).toBeInTheDocument();
    });
  });

  it("shows profile switcher at top of Dashboard and displays child expenses when selected", async () => {
    (api.getChildren as any).mockResolvedValue([
      {
        id: "child-1",
        name: "Lucas",
        email: "lucas@familia.com",
        role: "CHILD",
        parentId: "parent-1",
        spendingLimit: 200,
        totalBalance: 85,
        totalExpenses: 45,
        totalIncome: 130,
        transactionCount: 1,
      },
    ]);

    (api.getChildOverview as any).mockResolvedValue({
      child: {
        id: "child-1",
        name: "Lucas",
        email: "lucas@familia.com",
        role: "CHILD",
        parentId: "parent-1",
        spendingLimit: 200,
      },
      totalBalance: 85,
      totalExpenses: 45,
      totalIncome: 130,
      accounts: [{ id: "acc-c1", name: "Mesada", type: "cash", balance: 85 }],
      transactions: [
        {
          id: "tx-c1",
          description: "Lanche da Escola",
          amount: 45,
          type: "expense",
          category: "Alimentação",
          account: "Mesada",
          date: "2026-03-15",
          paymentMethod: "Dinheiro",
        },
      ],
      goals: [],
      spendingByCategory: [
        { category: "Alimentação", amount: 45, icon: "🍽️", color: "hsl(25, 95%, 53%)" },
      ],
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId("parental-profile-switcher")).toBeInTheDocument();
      expect(screen.getByText("Lucas")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Lucas"));

    await waitFor(() => {
      expect(screen.getByText(/Controle Parental: Gastos de Lucas/i)).toBeInTheDocument();
      expect(screen.getByText("Lanche da Escola")).toBeInTheDocument();
    });
  });
});
