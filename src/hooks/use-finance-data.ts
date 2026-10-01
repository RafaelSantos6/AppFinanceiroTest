import { useState, useEffect, useCallback, useRef } from "react";
import { Transaction, Account, Budget } from "@/lib/mock-data";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export function useFinanceData() {
  const { user, isAuthenticated } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const previousUserIdRef = useRef<string | null>(null);

  // Chaves de armazenamento isoladas por ID de usuário
  const getStorageKey = useCallback(
    (entity: string) => (user ? `ledger_${entity}_${user.id}` : `ledger_${entity}_guest`),
    [user]
  );

  // Limpa chaves legadas e antigas do localStorage
  useEffect(() => {
    try {
      localStorage.removeItem("ledger_transactions");
      localStorage.removeItem("ledger_accounts");
      localStorage.removeItem("ledger_budgets");
    } catch {
      // Ignora erro se localStorage inacessível
    }
  }, []);

  // Carrega os dados reais do usuário a partir do backend SQLite
  const loadUserData = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setTransactions([]);
      setAccounts([]);
      setBudgets([]);
      return;
    }

    setIsLoading(true);
    try {
      const [txs, accs, bdgs] = await Promise.all([
        api.getTransactions().catch(() => null),
        api.getAccounts().catch(() => null),
        api.getBudgets().catch(() => null),
      ]);

      if (txs !== null) {
        setTransactions(txs);
        localStorage.setItem(getStorageKey("transactions"), JSON.stringify(txs));
      } else {
        const cached = localStorage.getItem(getStorageKey("transactions"));
        setTransactions(cached ? JSON.parse(cached) : []);
      }

      if (accs !== null) {
        setAccounts(accs);
        localStorage.setItem(getStorageKey("accounts"), JSON.stringify(accs));
      } else {
        const cached = localStorage.getItem(getStorageKey("accounts"));
        setAccounts(cached ? JSON.parse(cached) : []);
      }

      if (bdgs !== null) {
        setBudgets(bdgs);
        localStorage.setItem(getStorageKey("budgets"), JSON.stringify(bdgs));
      } else {
        const cached = localStorage.getItem(getStorageKey("budgets"));
        setBudgets(cached ? JSON.parse(cached) : []);
      }
    } catch (error) {
      console.error("Erro ao sincronizar finanças com backend:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, getStorageKey]);

  // Recarrega sempre que o usuário autenticado mudar
  useEffect(() => {
    const currentUserId = user?.id ?? null;
    if (previousUserIdRef.current !== currentUserId) {
      // Limpa dados em memória ao trocar de usuário
      setTransactions([]);
      setAccounts([]);
      setBudgets([]);
      previousUserIdRef.current = currentUserId;
    }

    if (isAuthenticated && user) {
      loadUserData();
    } else {
      setTransactions([]);
      setAccounts([]);
      setBudgets([]);
    }
  }, [isAuthenticated, user, loadUserData]);

  // Transações CRUD
  const addTransaction = useCallback(
    async (tx: Omit<Transaction, "id">) => {
      const tempId = crypto.randomUUID();
      const optimisticTx: Transaction = { ...tx, id: tempId };
      setTransactions((prev) => [optimisticTx, ...prev]);

      try {
        const created = await api.createTransaction(tx);
        setTransactions((prev) => prev.map((t) => (t.id === tempId ? created : t)));
        // Recarrega contas para atualizar saldos sincronizados pelo backend
        const updatedAccounts = await api.getAccounts().catch(() => null);
        if (updatedAccounts) setAccounts(updatedAccounts);
      } catch (err) {
        console.error("Falha ao salvar transação na API:", err);
      }
    },
    []
  );

  const updateTransaction = useCallback(
    async (id: string, data: Partial<Transaction>) => {
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
      try {
        await api.updateTransaction(id, data);
        const updatedAccounts = await api.getAccounts().catch(() => null);
        if (updatedAccounts) setAccounts(updatedAccounts);
      } catch (err) {
        console.error("Falha ao atualizar transação na API:", err);
      }
    },
    []
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      try {
        await api.deleteTransaction(id);
        const updatedAccounts = await api.getAccounts().catch(() => null);
        if (updatedAccounts) setAccounts(updatedAccounts);
      } catch (err) {
        console.error("Falha ao deletar transação na API:", err);
      }
    },
    []
  );

  // Contas CRUD
  const addAccount = useCallback(
    async (acc: Omit<Account, "id">) => {
      const tempId = crypto.randomUUID();
      const optimisticAcc: Account = { ...acc, id: tempId };
      setAccounts((prev) => [...prev, optimisticAcc]);

      try {
        const created = await api.createAccount(acc);
        setAccounts((prev) => prev.map((a) => (a.id === tempId ? created : a)));
      } catch (err) {
        console.error("Falha ao salvar conta na API:", err);
      }
    },
    []
  );

  const updateAccount = useCallback(
    async (id: string, data: Partial<Account>) => {
      setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...data } : a)));
      try {
        await api.updateAccount(id, data);
      } catch (err) {
        console.error("Falha ao atualizar conta na API:", err);
      }
    },
    []
  );

  const deleteAccount = useCallback(
    async (id: string) => {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      try {
        await api.deleteAccount(id);
      } catch (err) {
        console.error("Falha ao remover conta na API:", err);
      }
    },
    []
  );

  // Orçamentos CRUD
  const addBudget = useCallback(
    async (budget: Omit<Budget, "id">) => {
      const tempId = crypto.randomUUID();
      const optimisticBudget: Budget = { ...budget, id: tempId, spent: 0 };
      setBudgets((prev) => [...prev, optimisticBudget]);

      try {
        const created = await api.createBudget(budget);
        setBudgets((prev) => prev.map((b) => (b.id === tempId ? created : b)));
      } catch (err) {
        console.error("Falha ao criar orçamento na API:", err);
      }
    },
    []
  );

  const updateBudget = useCallback(
    async (id: string, data: Partial<Budget>) => {
      setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
      try {
        await api.updateBudget(id, data);
      } catch (err) {
        console.error("Falha ao atualizar orçamento na API:", err);
      }
    },
    []
  );

  const deleteBudget = useCallback(
    async (id: string) => {
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      try {
        await api.deleteBudget(id);
      } catch (err) {
        console.error("Falha ao excluir orçamento na API:", err);
      }
    },
    []
  );

  // Totais calculados estritamente sobre as transações reais do usuário
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Recalcula o gasto de cada orçamento com base nas transações reais
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
    isLoading,
    refetchFinanceData: loadUserData,
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

