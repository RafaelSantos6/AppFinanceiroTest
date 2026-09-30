import { useState, useEffect, useCallback } from "react";
import {
  Transaction,
  Account,
  Budget,
  mockTransactions,
  mockAccounts,
  mockBudgets,
} from "@/lib/mock-data";

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

export function useFinanceData() {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadFromStorage("ledger_transactions", mockTransactions)
  );
  const [accounts, setAccounts] = useState<Account[]>(() =>
    loadFromStorage("ledger_accounts", mockAccounts)
  );
  const [budgets, setBudgets] = useState<Budget[]>(() =>
    loadFromStorage("ledger_budgets", mockBudgets)
  );

  useEffect(() => saveToStorage("ledger_transactions", transactions), [transactions]);
  useEffect(() => saveToStorage("ledger_accounts", accounts), [accounts]);
  useEffect(() => saveToStorage("ledger_budgets", budgets), [budgets]);

  // Transactions CRUD
  const addTransaction = useCallback((tx: Omit<Transaction, "id">) => {
    const newTx: Transaction = { ...tx, id: crypto.randomUUID() };
    setTransactions((prev) => [newTx, ...prev]);
  }, []);

  const updateTransaction = useCallback((id: string, data: Partial<Transaction>) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Accounts CRUD
  const addAccount = useCallback((acc: Omit<Account, "id">) => {
    const newAcc: Account = { ...acc, id: crypto.randomUUID() };
    setAccounts((prev) => [...prev, newAcc]);
  }, []);

  const updateAccount = useCallback((id: string, data: Partial<Account>) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
  }, []);

  const deleteAccount = useCallback((id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Budgets CRUD
  const addBudget = useCallback((budget: Omit<Budget, "id">) => {
    const newBudget: Budget = { ...budget, id: crypto.randomUUID() };
    setBudgets((prev) => [...prev, newBudget]);
  }, []);

  const updateBudget = useCallback((id: string, data: Partial<Budget>) => {
    setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
  }, []);

  const deleteBudget = useCallback((id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // Computed values
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Recalculate budget spent from transactions
  const budgetsWithSpent = budgets.map((b) => {
    const spent = transactions
      .filter((t) => t.type === "expense" && t.category === b.category)
      .reduce((sum, t) => sum + t.amount, 0);
    return { ...b, spent };
  });

  return {
    transactions,
    accounts,
    budgets: budgetsWithSpent,
    totalIncome,
    totalExpenses,
    balance,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    addBudget,
    updateBudget,
    deleteBudget,
  };
}
