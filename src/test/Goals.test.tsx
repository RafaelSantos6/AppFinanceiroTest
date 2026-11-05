import React from "react";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Goals from "@/pages/Goals";
import { useFinance } from "@/contexts/FinanceContext";

vi.mock("@/contexts/FinanceContext", () => ({
  useFinance: vi.fn(),
}));

describe("Goals Page", () => {
  const addGoalMock = vi.fn();
  const updateGoalMock = vi.fn();
  const deleteGoalMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useFinance).mockReturnValue({
      goals: [
        {
          id: "g1",
          name: "Reserva de Emergência",
          targetAmount: 10000,
          currentAmount: 4000,
          deadline: "2027-06-30",
          icon: "🛡️",
          color: "hsl(142, 71%, 45%)",
        },
      ],
      addGoal: addGoalMock,
      updateGoal: updateGoalMock,
      deleteGoal: deleteGoalMock,
    } as unknown as ReturnType<typeof useFinance>);
  });

  it("renders goals list and overall progress", () => {
    render(<Goals />);
    expect(screen.getByText("Reserva de Emergência")).toBeInTheDocument();
    expect(screen.getByText("Progresso Geral das Metas")).toBeInTheDocument();
    expect(screen.getAllByText(/40%/)[0]).toBeInTheDocument();
  });

  it("opens form and creates a new goal", async () => {
    const user = userEvent.setup();
    render(<Goals />);

    await user.click(screen.getByRole("button", { name: /Nova Meta/i }));
    expect(screen.getByRole("heading", { name: "Nova Meta" })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Nome da Meta/i), "Viagem Europa");
    await user.type(screen.getByLabelText(/Valor Alvo/i), "15000");

    const currentInput = screen.getByLabelText(/Já Guardado/i);
    await user.clear(currentInput);
    await user.type(currentInput, "3000");

    await user.click(screen.getByRole("button", { name: "Criar Meta" }));

    expect(addGoalMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Viagem Europa",
        targetAmount: 15000,
        currentAmount: 3000,
      })
    );
  });

  it("allows quick deposit into an existing goal", async () => {
    const user = userEvent.setup();
    render(<Goals />);

    await user.click(screen.getByRole("button", { name: /Aportar/i }));
    await user.type(screen.getByLabelText(/Valor \(R\$\)/i), "500");
    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(updateGoalMock).toHaveBeenCalledWith("g1", { currentAmount: 4500 });
  });

  it("opens delete confirmation and deletes goal", async () => {
    const user = userEvent.setup();
    render(<Goals />);

    await user.click(screen.getByRole("button", { name: "Excluir meta" }));
    expect(screen.getByText("Excluir meta financeira?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Excluir" }));
    expect(deleteGoalMock).toHaveBeenCalledWith("g1");
  });
});
