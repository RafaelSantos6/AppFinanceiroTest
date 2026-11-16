import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Categories from "@/pages/Categories";
import { useFinance } from "@/contexts/FinanceContext";
import { useToast } from "@/components/ui/use-toast";

vi.mock("@/contexts/FinanceContext", () => ({
  useFinance: vi.fn(),
}));
vi.mock("@/components/ui/use-toast", () => ({
  useToast: vi.fn(),
}));

describe("Categories Page", () => {
  const addCategoryMock = vi.fn();
  const deleteCategoryMock = vi.fn();
  const toastMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as any).mockReturnValue({ toast: toastMock });
    (useFinance as any).mockReturnValue({
      categories: [
        { id: "cat1", name: "Saúde", type: "expense", icon: "💊", color: "#f00" },
        { id: "cat2", name: "Salário", type: "income", icon: "💰", color: "#0f0" },
      ],
      addCategory: addCategoryMock,
      deleteCategory: deleteCategoryMock,
    });
  });

  it("renders categories split by type", () => {
    render(<Categories />);
    expect(screen.getByText("Saúde")).toBeInTheDocument();
    expect(screen.getByText("Salário")).toBeInTheDocument();
    expect(screen.getByText("Categorias de Despesa")).toBeInTheDocument();
    expect(screen.getByText("Categorias de Receita")).toBeInTheDocument();
  });

  it("opens modal and adds a new category", async () => {
    const user = userEvent.setup();
    render(<Categories />);
    await user.click(screen.getByText("Nova Categoria"));
    
    const nameInput = screen.getByPlaceholderText("Ex: Assinaturas");
    await user.type(nameInput, "Lazer");
    
    const saveBtn = screen.getByText("Salvar Categoria");
    await user.click(saveBtn);
    
    await waitFor(() => {
      expect(addCategoryMock).toHaveBeenCalledWith(expect.objectContaining({
        name: "Lazer",
        type: "expense"
      }));
    });
  });
});

