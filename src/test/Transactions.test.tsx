import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Transactions from "@/pages/Transactions";
import { useFinance } from "@/contexts/FinanceContext";
import userEvent from "@testing-library/user-event";

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
    installmentCurrent: 1,
    installmentTotal: 3,
    recurrenceType: "INSTALLMENT",
    recurrenceGroupId: "group1"
  },
  {
    id: "tx3",
    description: "Netflix",
    amount: 50,
    type: "expense",
    category: "Entertainment",
    date: "2023-10-15",
    accountId: "acc1",
    recurrenceGroupId: "group2",
    recurrenceType: "FIXED"
  },
];

describe("Transactions Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useFinance as any).mockReturnValue({
      transactions: mockTransactions,
      categories: [{ id: "cat1", name: "Food", type: "expense", color: "#f00" }],
      deleteTransaction: vi.fn(),
    });
  });

  it("should render list and display badges for installments and recurrence", () => {
    render(<Transactions />);
    expect(screen.getByText("MySalary")).toBeInTheDocument();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    
    expect(screen.getByText("1/3")).toBeInTheDocument();
    expect(screen.getByText("Fixa")).toBeInTheDocument();
  });

  it("should filter by text", async () => {
    render(<Transactions />);
    const searchInput = screen.getByPlaceholderText("Buscar transações...");
    
    fireEvent.change(searchInput, { target: { value: "MySalary" } });
    expect(screen.getByText("MySalary")).toBeInTheDocument();
    expect(screen.queryByText("Groceries")).not.toBeInTheDocument();
  });
});
