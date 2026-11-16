import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Budgets from "@/pages/Budgets";
import { useFinance } from "@/contexts/FinanceContext";

vi.mock("@/contexts/FinanceContext", () => ({
  useFinance: vi.fn(),
}));

describe("Budgets Page", () => {
  const addBudgetMock = vi.fn();
  const updateBudgetMock = vi.fn();
  const deleteBudgetMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useFinance).mockReturnValue({
      budgets: [
        { id: "b1", category: "Alimentação", limit: 1000, spent: 800 },
      ],
      addBudget: addBudgetMock,
      updateBudget: updateBudgetMock,
      deleteBudget: deleteBudgetMock,
    } as unknown as ReturnType<typeof useFinance>);
  });

  it("renders budget list and overall progress", () => {
    render(<Budgets />);
    expect(screen.getByText("Alimentação")).toBeInTheDocument();
    expect(screen.getByText("Orçamento Geral")).toBeInTheDocument();
    expect(screen.getByText(/80%/)).toBeInTheDocument();
  });

  it("opens form and adds new budget", async () => {
    const user = userEvent.setup();
    render(<Budgets />);

    // Click "Novo Orçamento"
    await user.click(screen.getByText("Novo Orçamento"));
    expect(screen.getByRole("heading", { name: "Novo Orçamento" })).toBeInTheDocument();

    // Select a category with Radix Select (combobox)
    const selectTrigger = screen.getByRole("combobox");
    selectTrigger.focus();
    await user.keyboard("{Enter}{ArrowDown}{Enter}");

    // Type monthly limit
    const limitInput = screen.getByPlaceholderText("0,00");
    await user.type(limitInput, "500");

    // Submit form
    await user.click(screen.getByRole("button", { name: "Criar Orçamento" }));

    expect(addBudgetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 500,
        spent: 0,
      })
    );
  });

  it("opens edit form and updates budget limit", async () => {
    const user = userEvent.setup();
    const { container } = render(<Budgets />);

    // Find the pencil edit button
    const editButton = container.querySelector(".lucide-pencil")?.closest("button");
    expect(editButton).toBeTruthy();
    await user.click(editButton!);

    expect(screen.getByRole("heading", { name: "Editar Orçamento" })).toBeInTheDocument();

    const limitInput = screen.getByDisplayValue("1000");
    await user.clear(limitInput);
    await user.type(limitInput, "1200");

    await user.click(screen.getByRole("button", { name: "Atualizar" }));

    expect(updateBudgetMock).toHaveBeenCalledWith("b1", { limit: 1200 });
  });

  it("opens delete dialog and deletes budget", async () => {
    const user = userEvent.setup();
    const { container } = render(<Budgets />);

    // Find the trash delete button
    const deleteButton = container.querySelector(".lucide-trash2")?.closest("button");
    expect(deleteButton).toBeTruthy();
    await user.click(deleteButton!);

    // AlertDialog should be displayed
    expect(screen.getByText("Excluir orçamento?")).toBeInTheDocument();

    const confirmDeleteBtn = screen.getByRole("button", { name: "Excluir" });
    await user.click(confirmDeleteBtn);

    expect(deleteBudgetMock).toHaveBeenCalledWith("b1");
  });
});
