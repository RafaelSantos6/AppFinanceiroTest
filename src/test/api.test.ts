import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "@/lib/api";

// Configura o mock global do fetch
global.fetch = vi.fn();

describe("API Client", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  describe("checkHealth", () => {
    it("should return true if fetch is ok", async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true });
      const result = await api.checkHealth();
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/health"), { method: "GET" });
    });

    it("should return false if fetch fails", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network Error"));
      const result = await api.checkHealth();
      expect(result).toBe(false);
    });
  });

  describe("auth", () => {
    it("login should post to /auth/login and return data", async () => {
      const mockData = { token: "abc", user: { id: "1" } };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await api.login("test@test.com", "pass");
      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/login"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "test@test.com", password: "pass" }),
        })
      );
    });

    it("login should throw error on failure", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Invalid credentials" }),
      });

      await expect(api.login("test@test.com", "pass")).rejects.toThrow("Invalid credentials");
    });

    it("register should post to /auth/register and return data", async () => {
      const mockData = { token: "abc", user: { id: "1" } };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await api.register("Name", "test@test.com", "pass");
      expect(result).toEqual(mockData);
    });
  });

  describe("authenticated requests", () => {
    beforeEach(() => {
      localStorage.setItem("ledger_auth_token", "test-token");
    });

    it("getTransactions should fetch with auth header", async () => {
      const mockTxs = [{ id: "tx1", amount: 100 }];
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTxs,
      });

      const result = await api.getTransactions();
      expect(result).toEqual(mockTxs);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/transactions"),
        expect.objectContaining({
          headers: { Authorization: "Bearer test-token" },
        })
      );
    });

    it("deleteTransaction should append deleteAllFuture if true", async () => {
      (global.fetch as any).mockResolvedValueOnce({ ok: true });
      await api.deleteTransaction("tx1", true);
      
      const calls = (global.fetch as any).mock.calls;
      const url = calls[0][0];
      expect(url).toContain("deleteAllFuture=true");
      expect(calls[0][1].method).toBe("DELETE");
    });

    it("should not use auth header for demo tokens", async () => {
      localStorage.setItem("ledger_auth_token", "demo-token");
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await api.getTransactions();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.not.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      );
    });
  });

  describe("generic CRUD methods", () => {
    beforeEach(() => {
      localStorage.setItem("ledger_auth_token", "test-token");
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
    });

    it("should handle Accounts", async () => {
      await api.getAccounts();
      await api.createAccount({ name: "Acc", balance: 0, type: "checking" });
      await api.updateAccount("1", { name: "Updated" });
      await api.deleteAccount("1");
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it("should handle Budgets", async () => {
      await api.getBudgets();
      await api.createBudget({ category: "Food", amount: 100, spent: 0 });
      await api.updateBudget("1", { amount: 200 });
      await api.deleteBudget("1");
      expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it("should handle Categories", async () => {
      await api.getCategories();
      await api.createCategory({ name: "Food", color: "#000", type: "expense" });
      await api.deleteCategory("1");
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
    
    it("should handle Transactions create and update", async () => {
      await api.createTransaction({ amount: 10, type: "income", date: "2023", category: "Cat" });
      await api.updateTransaction("1", { amount: 20 });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
  
  describe("error handling", () => {
    beforeEach(() => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      });
    });
    
    it("should throw standard errors when endpoints fail", async () => {
      await expect(api.getTransactions()).rejects.toThrow("Erro ao carregar transações");
      await expect(api.createTransaction({ amount: 10 } as any)).rejects.toThrow("Erro ao salvar transação");
      await expect(api.updateTransaction("1", {})).rejects.toThrow("Erro ao atualizar transação");
      await expect(api.deleteTransaction("1")).rejects.toThrow("Erro ao remover transação");
      
      await expect(api.getAccounts()).rejects.toThrow("Erro ao carregar contas");
      await expect(api.createAccount({} as any)).rejects.toThrow("Erro ao salvar conta");
      await expect(api.updateAccount("1", {})).rejects.toThrow("Erro ao atualizar conta");
      await expect(api.deleteAccount("1")).rejects.toThrow("Erro ao remover conta");
      
      await expect(api.getBudgets()).rejects.toThrow("Erro ao carregar orçamentos");
      await expect(api.createBudget({} as any)).rejects.toThrow("Erro ao salvar orçamento");
      await expect(api.updateBudget("1", {})).rejects.toThrow("Erro ao atualizar orçamento");
      await expect(api.deleteBudget("1")).rejects.toThrow("Erro ao remover orçamento");
      
      await expect(api.getCategories()).rejects.toThrow("Erro ao carregar categorias");
      await expect(api.createCategory({} as any)).rejects.toThrow("Erro ao salvar categoria");
      await expect(api.deleteCategory("1")).rejects.toThrow("Erro ao remover categoria");
      
      await expect(api.register("", "", "")).rejects.toThrow("Erro no cadastro");
    });
  });
});

