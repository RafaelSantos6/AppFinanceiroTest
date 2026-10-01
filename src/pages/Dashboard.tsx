import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { useFinance } from "@/contexts/FinanceContext";
import {
  calculateMonthlyTrend,
  formatCurrency,
  defaultCategories,
} from "@/lib/mock-data";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function Dashboard() {
  const { transactions, budgets, totalIncome, totalExpenses, balance } = useFinance();
  const dynamicTrend = calculateMonthlyTrend(transactions);

  const categorySpending = budgets.map((b) => {
    const cat = defaultCategories.find((c) => c.name === b.category);
    return { name: b.category, spent: b.spent, limit: b.limit, color: cat?.color ?? "hsl(221,83%,53%)" };
  });

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const currentMonthYear = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading">Painel</h1>
        <p className="text-sm text-muted-foreground capitalize">Resumo de {currentMonthYear}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Saldo Total"
          value={balance}
          icon={Wallet}
        />
        <StatCard
          label="Total de Receitas"
          value={totalIncome}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          label="Total de Despesas"
          value={totalExpenses}
          icon={TrendingDown}
          variant="destructive"
        />
        <StatCard
          label="Taxa de Economia"
          value={totalIncome > 0 ? (balance / totalIncome) * 100 : 0}
          icon={DollarSign}
          isCurrency={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-xl shadow-card p-5">
          <h2 className="text-heading mb-4">Tendência Mensal</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dynamicTrend} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(215,16%,47%)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(215,16%,47%)" }} tickFormatter={(v) => `R$${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ background: "hsl(0,0%,100%)", border: "1px solid hsl(214,32%,91%)", borderRadius: "8px", fontSize: "13px" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="income" name="Receitas" fill="hsl(142,71%,45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Despesas" fill="hsl(0,84%,60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-card p-5">
          <h2 className="text-heading mb-4">Gastos por Categoria</h2>
          {categorySpending.length > 0 ? (
            <div className="space-y-3">
              {categorySpending.map((cat) => {
                const pct = cat.limit > 0 ? Math.min((cat.spent / cat.limit) * 100, 100) : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{cat.name}</span>
                      <span className="text-xs text-muted-foreground font-mono tabular-nums">
                        {formatCurrency(cat.spent)} / {formatCurrency(cat.limit)}
                      </span>
                    </div>
                    <div className="h-2 bg-accent rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: pct > 90 ? "hsl(0,84%,60%)" : pct > 70 ? "hsl(38,92%,50%)" : cat.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
             <p className="text-sm text-muted-foreground text-center py-8">Nenhum orçamento definido ainda.</p>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-card">
        <div className="p-5 border-b border-border">
          <h2 className="text-heading">Transações Recentes</h2>
        </div>
        <div className="divide-y divide-border">
          {recentTransactions.map((tx) => {
            const cat = defaultCategories.find((c) => c.name === tx.category);
            return (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg">{cat?.icon ?? "📝"}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.category} · {new Date(tx.date).toLocaleDateString("pt-BR", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
                <span className={`font-mono tabular-nums text-sm font-semibold ${tx.type === "income" ? "text-success" : "text-foreground"}`}>
                  {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                </span>
              </div>
            );
          })}
          {recentTransactions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma transação ainda. Use o botão + para adicionar.</p>
          )}
        </div>
      </div>
    </div>
  );
}
