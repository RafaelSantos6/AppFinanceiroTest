import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Accounts from "@/pages/Accounts";
import { useFinance } from "@/contexts/FinanceContext";

vi.mock("@/contexts/FinanceContext", () => ({
  useFinance: vi.fn(),
}));

describe("Accounts Page", () => {
  const addAccountMock = vi.fn();
  const updateAccountMock = vi.fn();
  const deleteAccountMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useFinance as any).mockReturnValue({
      accounts: [
        { id: "acc1", name: "Nubank", type: "bank", balance: 1500 },
        { id: "acc2", name: "Wallet", type: "cash", balance: -50 },
      ],
      addAccount: addAccountMock,
      updateAccount: updateAccountMock,
      deleteAccount: deleteAccountMock,
    });
  });

  it("renders accounts list", () => {
    render(<Accounts />);
    expect(screen.getByText("Nubank")).toBeInTheDocument();
    expect(screen.getByText("Wallet")).toBeInTheDocument();
  });

  it("opens form and adds new account", async () => {
    const user = userEvent.setup();
    render(<Accounts />);
    await user.click(screen.getByText("Nova Conta"));
    
    const input = screen.getByPlaceholderText("Ex: Nubank");
    await user.type(input, "Itaú");
    
    await user.click(screen.getByText("Criar Conta"));
    
    expect(addAccountMock).toHaveBeenCalledWith({
      name: "Itaú",
      type: "bank",
      balance: 0,
    });
  });
});

