import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Dashboard from "@/pages/Dashboard";
import { useFinance } from "@/contexts/FinanceContext";

vi.mock("@/contexts/FinanceContext", () => ({
  useFinance: vi.fn(),
}));

const mockTransactions = [
  {
    id: "tx1",
    description: "MySalary",
    amount: 5000,
    type: "income",
    category: "SalaryCat",
    date: "2023-10-05",
    accountId: "acc1",
  },
  {
    id: "tx2",
    description: "Groceries",
    amount: 300,
    type: "expense",
    category: "Food",
    date: "2023-10-10",
    accountId: "acc1",
  }
];

describe("Dashboard Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useFinance as any).mockReturnValue({
      transactions: mockTransactions,
      totalIncome: 5000,
      totalExpenses: 300,
      balance: 4700,
      accounts: [],
      budgets: [],
      selectedMonth: "2023-10",
    });
  });

  it("should render stat cards and recent transactions", () => {
    render(<Dashboard />);
    
    // Check StatCards (they display formatted currency)
    // In node 20+, Intl.NumberFormat format space might be narrow no-break space.
    // We just check if the numbers exist.
    expect(screen.getAllByText(/5\.000/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/300/)[0]).toBeInTheDocument();
    expect(screen.getByText(/4\.700/)).toBeInTheDocument();
    
    // Check recent transactions
    expect(screen.getByText("MySalary")).toBeInTheDocument();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
  });
});
