import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Reports from "@/pages/Reports";
import { useFinance } from "@/contexts/FinanceContext";
import React from "react";

// Mock para Recharts para evitar erros de redimensionamento
vi.mock("recharts", async () => {
  const OriginalRecharts = await vi.importActual("recharts");
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    BarChart: () => <div data-testid="bar-chart" />,
  };
});

vi.mock("@/contexts/FinanceContext", () => ({
  useFinance: vi.fn(),
}));

describe("Reports page", () => {
  it("should update metrics when month is changed in MonthYearSelector", async () => {
    const setSelectedMonth = vi.fn();
    
    // Mock the initial state for October
    (useFinance as any).mockReturnValue({
      selectedMonth: "2026-10",
      setSelectedMonth,
      totalIncome: 5000,
      totalExpenses: 2000,
      balance: 3000,
      allTransactions: [],
      transactions: [],
      accounts: [],
      budgets: [],
      categories: [],
      isLoading: false,
    });

    const { rerender } = render(<Reports />);

    // Verificar se os valores de Outubro estão renderizados
    // Como os valores são formatados em pt-BR (R$ 5.000,00), a gente faz uma checagem flexível
    // Note: Em Node v24 (Vitest), NBSP (160) pode ser retornado em vez de espaço
    const normalizeSpaces = (text: string | null) => (text || "").replace(/\s/g, " ");

    const checkTextExists = (text: string) => {
      return screen.getAllByText((content, element) => {
        return normalizeSpaces(content).includes(text);
      }).length > 0;
    };

    expect(checkTextExists("5.000,00")).toBe(true); // Income
    expect(checkTextExists("2.000,00")).toBe(true); // Expenses

    const user = userEvent.setup();

    // Mudar de Outubro de 2026 para Novembro de 2026
    // Em MonthYearSelector, tem os botões de chevron-left e chevron-right
    // Pega o botão "Avançar mês"
    // Encontra os botões de avançar/voltar mês
    // Como eles não tem aria-label, vamos pegar pelo ícone lucide-chevron-right
    const nextMonthSvg = document.querySelector('.lucide-chevron-right');
    const nextMonthBtn = nextMonthSvg?.closest('button');
    if (nextMonthBtn) {
      await user.click(nextMonthBtn);
    }

    // Deve chamar setSelectedMonth com o próximo mês (Novembro)
    expect(setSelectedMonth).toHaveBeenCalledWith("2026-11");

    // Re-renderizamos o componente para simular o update de Context (Novembro)
    (useFinance as any).mockReturnValue({
      selectedMonth: "2026-11",
      setSelectedMonth,
      totalIncome: 6000,
      totalExpenses: 3000,
      balance: 3000,
      allTransactions: [],
      transactions: [],
      accounts: [],
      budgets: [],
      categories: [],
      isLoading: false,
    });

    rerender(<Reports />);

    // Verifica se atualizou os cartões
    expect(checkTextExists("6.000,00")).toBe(true); // Novo Income
    expect(checkTextExists("3.000,00")).toBe(true); // Novo Expenses

    // Certifique-se de que o chart está na tela
    expect(screen.getAllByTestId("bar-chart").length).toBeGreaterThan(0);
  });
});
