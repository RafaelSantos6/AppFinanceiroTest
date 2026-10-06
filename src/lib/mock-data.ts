export interface Transaction {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  description: string;
  date: string;
  paymentMethod: string;
  account: string;
  recurrenceType?: "NONE" | "FIXED" | "INSTALLMENT";
  installmentCurrent?: number;
  installmentTotal?: number;
  recurrenceGroupId?: string;
  isPaid?: boolean;
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

export const mockAccounts: Account[] = [];
export const mockTransactions: Transaction[] = [];
export const mockBudgets: Budget[] = [];
export const monthlyTrendData: any[] = [];

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

export function calculateMonthlyTrend(
  transactions: Transaction[], 
  baseMonth?: string // format "YYYY-MM"
): { month: string; income: number; expenses: number }[] {
  const result: Record<string, { income: number; expenses: number }> = {};
  
  // Parse baseMonth or use current
  let baseDate = new Date();
  if (baseMonth) {
    const [year, month] = baseMonth.split("-");
    baseDate = new Date(parseInt(year), parseInt(month) - 1, 15); // use middle of month
  }
  
  // Initialize last 6 months ending in baseDate
  const monthsOrdered: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(baseDate.getTime());
    d.setMonth(d.getMonth() - i);
    const monthName = d.toLocaleDateString("pt-BR", { month: "short" });
    result[monthName] = { income: 0, expenses: 0 };
    monthsOrdered.push(monthName);
  }

  transactions.forEach((tx) => {
    const d = new Date(tx.date + "T12:00:00Z"); // middle of day to avoid timezone shift
    const monthName = d.toLocaleDateString("pt-BR", { month: "short" });
    if (result[monthName]) {
      if (tx.type === "income") {
        result[monthName].income += tx.amount;
      } else {
        result[monthName].expenses += tx.amount;
      }
    }
  });

  return monthsOrdered.map((month) => ({
    month,
    income: result[month].income,
    expenses: result[month].expenses,
  }));
}
