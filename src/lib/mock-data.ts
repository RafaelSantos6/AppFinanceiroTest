export interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string;
  date: string;
  paymentMethod: string;
  account: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense" | "both";
}

export interface Account {
  id: string;
  name: string;
  type: "bank" | "cash" | "credit" | "savings";
  balance: number;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
}

export const defaultCategories: Category[] = [
  { id: "1", name: "Alimentação", icon: "🍽️", color: "hsl(25, 95%, 53%)", type: "expense" },
  { id: "2", name: "Transporte", icon: "🚗", color: "hsl(221, 83%, 53%)", type: "expense" },
  { id: "3", name: "Moradia", icon: "🏠", color: "hsl(262, 83%, 58%)", type: "expense" },
  { id: "4", name: "Entretenimento", icon: "🎬", color: "hsl(330, 81%, 60%)", type: "expense" },
  { id: "5", name: "Saúde", icon: "💊", color: "hsl(142, 71%, 45%)", type: "expense" },
  { id: "6", name: "Compras", icon: "🛍️", color: "hsl(38, 92%, 50%)", type: "expense" },
  { id: "7", name: "Contas", icon: "⚡", color: "hsl(199, 89%, 48%)", type: "expense" },
  { id: "8", name: "Educação", icon: "📚", color: "hsl(47, 95%, 53%)", type: "expense" },
  { id: "9", name: "Salário", icon: "💰", color: "hsl(142, 71%, 45%)", type: "income" },
  { id: "10", name: "Freelance", icon: "💻", color: "hsl(221, 83%, 53%)", type: "income" },
  { id: "11", name: "Investimentos", icon: "📈", color: "hsl(262, 83%, 58%)", type: "income" },
];

export const mockAccounts: Account[] = [
  { id: "1", name: "Conta Corrente", type: "bank", balance: 4280.50 },
  { id: "2", name: "Dinheiro", type: "cash", balance: 340.00 },
  { id: "3", name: "Cartão Visa", type: "credit", balance: -1250.00 },
  { id: "4", name: "Poupança", type: "savings", balance: 12500.00 },
];

export const mockTransactions: Transaction[] = [
  { id: "1", amount: 5200, type: "income", category: "Salário", description: "Salário de março", date: "2026-03-01", paymentMethod: "Transferência", account: "Conta Corrente" },
  { id: "2", amount: 85.40, type: "expense", category: "Alimentação", description: "Compras da semana", date: "2026-03-15", paymentMethod: "Débito", account: "Conta Corrente" },
  { id: "3", amount: 45.00, type: "expense", category: "Transporte", description: "Posto de gasolina", date: "2026-03-14", paymentMethod: "Crédito", account: "Cartão Visa" },
  { id: "4", amount: 1200.00, type: "expense", category: "Moradia", description: "Aluguel", date: "2026-03-01", paymentMethod: "Transferência", account: "Conta Corrente" },
  { id: "5", amount: 29.99, type: "expense", category: "Entretenimento", description: "Assinaturas streaming", date: "2026-03-10", paymentMethod: "Crédito", account: "Cartão Visa" },
  { id: "6", amount: 120.00, type: "expense", category: "Saúde", description: "Academia", date: "2026-03-05", paymentMethod: "Débito", account: "Conta Corrente" },
  { id: "7", amount: 65.00, type: "expense", category: "Compras", description: "Fone de ouvido", date: "2026-03-12", paymentMethod: "Dinheiro", account: "Dinheiro" },
  { id: "8", amount: 800.00, type: "income", category: "Freelance", description: "Projeto de design", date: "2026-03-08", paymentMethod: "Transferência", account: "Conta Corrente" },
  { id: "9", amount: 42.50, type: "expense", category: "Alimentação", description: "Jantar restaurante", date: "2026-03-16", paymentMethod: "Crédito", account: "Cartão Visa" },
  { id: "10", amount: 150.00, type: "expense", category: "Contas", description: "Conta de luz", date: "2026-03-03", paymentMethod: "Transferência", account: "Conta Corrente" },
  { id: "11", amount: 55.00, type: "expense", category: "Transporte", description: "Passe mensal", date: "2026-03-02", paymentMethod: "Débito", account: "Conta Corrente" },
  { id: "12", amount: 200.00, type: "income", category: "Investimentos", description: "Dividendos", date: "2026-03-15", paymentMethod: "Transferência", account: "Poupança" },
];

export const mockBudgets: Budget[] = [
  { id: "1", category: "Alimentação", limit: 400, spent: 127.90 },
  { id: "2", category: "Transporte", limit: 200, spent: 100.00 },
  { id: "3", category: "Moradia", limit: 1300, spent: 1200.00 },
  { id: "4", category: "Entretenimento", limit: 100, spent: 29.99 },
  { id: "5", category: "Saúde", limit: 150, spent: 120.00 },
  { id: "6", category: "Compras", limit: 200, spent: 65.00 },
  { id: "7", category: "Contas", limit: 200, spent: 150.00 },
];

export const monthlyTrendData = [
  { month: "Out", income: 5200, expenses: 3100 },
  { month: "Nov", income: 5400, expenses: 3400 },
  { month: "Dez", income: 6100, expenses: 4200 },
  { month: "Jan", income: 5200, expenses: 2900 },
  { month: "Fev", income: 5600, expenses: 3300 },
  { month: "Mar", income: 6200, expenses: 1792.89 },
];

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(amount);
}

export const accountTypeLabels: Record<string, string> = {
  bank: "Conta Bancária",
  cash: "Dinheiro",
  credit: "Cartão de Crédito",
  savings: "Poupança",
};

export const paymentMethods = ["Dinheiro", "Débito", "Crédito", "Transferência", "PIX"];
