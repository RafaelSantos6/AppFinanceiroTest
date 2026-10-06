import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TransactionForm } from "@/components/TransactionForm";
import React from "react";

if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Polyfill for Radix UI Pointer Events in jsdom
if (typeof Element !== "undefined") {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
}

if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView = function() {};
}

vi.mock("@/contexts/FinanceContext", () => ({
  useFinance: vi.fn(),
}));

import { useFinance } from "@/contexts/FinanceContext";

// Mock das contas
const mockAccounts = [
  { id: "acc1", name: "Conta Corrente", balance: 1000, type: "checking" as const },
];

const mockCategories = [
  { id: "cat1", name: "Compras", color: "#000", type: "expense" as const },
];

describe("TransactionForm", () => {
  it("should submit the form with installment data when 'Parcelada' is selected", async () => {
    (useFinance as any).mockReturnValue({
      accounts: mockAccounts,
      categories: mockCategories,
      addTransaction: vi.fn(),
      updateTransaction: vi.fn(),
    });

    const handleSubmit = vi.fn();

    render(
      <TransactionForm
        onSubmit={handleSubmit}
      />
    );

    const user = userEvent.setup();

    // Preenche descrição e valor
    await user.type(screen.getByPlaceholderText(/para que foi isso/i), "Compra no cartão");
    
    // O valor no HTML está como input type="number" placeholder="0,00"
    const amountInput = screen.getByPlaceholderText("0,00");
    await user.type(amountInput, "300");
    // Se o onChange do CurrencyInput passa números diretos, pode ser que '30000' resulte em 300.00.
    
    // O Radix Select renderiza como button role="combobox"
    const comboboxes = screen.getAllByRole("combobox");
    
    // 0: Categoria -> Tem apenas 1 categoria "Compras", então seta para baixo + Enter seleciona a primeira
    comboboxes[0].focus();
    await user.keyboard("{Enter}{ArrowDown}{Enter}");

    // Frequência
    // Opções: Única, Fixa, Parcelada. Parcelada é a 3ª.
    comboboxes[1].focus();
    await user.keyboard("{Enter}{ArrowDown}{ArrowDown}{ArrowDown}{Enter}");

    // Conta é o quarto combobox (Categoria, Frequência, Pagamento, Conta)
    if (comboboxes.length > 3) {
      comboboxes[3].focus();
      await user.keyboard("{Enter}{ArrowDown}{Enter}");
    }

    // Quando selecionado "Parcelada", um input de quantidade de parcelas deve aparecer
    // Pode ser o segundo input do tipo spinbutton (type="number"), pois o primeiro é o Valor
    const numberInputs = await screen.findAllByRole("spinbutton");
    // O Valor é [0], Parcelas é [1] (ou o último)
    const installmentsInput = numberInputs[numberInputs.length - 1];
    await user.clear(installmentsInput);
    await user.type(installmentsInput, "3");

    // Marcar como pago/não pago
    const isPaidSwitch = screen.getByRole("switch");
    if (!isPaidSwitch.hasAttribute("data-state") || isPaidSwitch.getAttribute("data-state") === "unchecked") {
      await user.click(isPaidSwitch);
    }

    // Submit
    const submitBtn = screen.getByRole("button", { name: /adicionar transação/i });
    await user.click(submitBtn);

    const mockFinance = useFinance();

    // Verifica callback
    await waitFor(() => {
      expect(mockFinance.addTransaction).toHaveBeenCalledTimes(1);
    });

    const submittedData = (mockFinance.addTransaction as any).mock.calls[0][0];
    expect(submittedData.description).toBe("Compra no cartão");
    expect(submittedData.recurrenceType).toBe("INSTALLMENT");
    expect(submittedData.installmentTotal).toBe(3);
    expect(submittedData.account).toBe("Conta Corrente");
    expect(submittedData.category).toBe("Compras");
    // isPaid checks
    expect(submittedData.isPaid).toBe(true);
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });
});
