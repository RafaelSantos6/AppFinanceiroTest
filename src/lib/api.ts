import { Account, Budget, Transaction, Category } from "./mock-data";

const rawUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3333" : "https://appfinanceiro-api.onrender.com");
const API_BASE_URL = rawUrl.endsWith("/api") ? rawUrl : `${rawUrl}/api`;

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("ledger_auth_token");
  if (token && !token.startsWith("demo-") && !token.startsWith("mock-")) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export const api = {
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`, { method: "GET" });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erro no login");
    return data;
  },

  async register(name: string, email: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erro no cadastro");
    return data;
  },

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    const res = await fetch(`${API_BASE_URL}/transactions`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Erro ao carregar transações");
    return res.json();
  },

  async createTransaction(tx: Omit<Transaction, "id">): Promise<Transaction> {
    const res = await fetch(`${API_BASE_URL}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(tx),
    });
    if (!res.ok) throw new Error("Erro ao salvar transação");
    return res.json();
  },

  async updateTransaction(id: string, tx: Partial<Transaction>): Promise<Transaction> {
    const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(tx),
    });
    if (!res.ok) throw new Error("Erro ao atualizar transação");
    return res.json();
  },

  async deleteTransaction(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/transactions/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Erro ao remover transação");
  },

  // Accounts
  async getAccounts(): Promise<Account[]> {
    const res = await fetch(`${API_BASE_URL}/accounts`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Erro ao carregar contas");
    return res.json();
  },

  async createAccount(acc: Omit<Account, "id">): Promise<Account> {
    const res = await fetch(`${API_BASE_URL}/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(acc),
    });
    if (!res.ok) throw new Error("Erro ao salvar conta");
    return res.json();
  },

  async updateAccount(id: string, acc: Partial<Account>): Promise<Account> {
    const res = await fetch(`${API_BASE_URL}/accounts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(acc),
    });
    if (!res.ok) throw new Error("Erro ao atualizar conta");
    return res.json();
  },

  async deleteAccount(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/accounts/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Erro ao remover conta");
  },

  // Budgets
  async getBudgets(): Promise<Budget[]> {
    const res = await fetch(`${API_BASE_URL}/budgets`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Erro ao carregar orçamentos");
    return res.json();
  },

  async createBudget(b: Omit<Budget, "id">): Promise<Budget> {
    const res = await fetch(`${API_BASE_URL}/budgets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(b),
    });
    if (!res.ok) throw new Error("Erro ao salvar orçamento");
    return res.json();
  },

  async updateBudget(id: string, b: Partial<Budget>): Promise<Budget> {
    const res = await fetch(`${API_BASE_URL}/budgets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(b),
    });
    if (!res.ok) throw new Error("Erro ao atualizar orçamento");
    return res.json();
  },

  async deleteBudget(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/budgets/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Erro ao remover orçamento");
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Erro ao carregar categorias");
    return res.json();
  },

  async createCategory(c: Omit<Category, "id">): Promise<Category> {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(c),
    });
    if (!res.ok) throw new Error("Erro ao salvar categoria");
    return res.json();
  },

  async deleteCategory(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: "DELETE",
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error("Erro ao remover categoria");
  },
};
