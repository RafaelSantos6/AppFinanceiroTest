import { useFinance } from "@/contexts/FinanceContext";
import {
  monthlyTrendData,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function Reports() {
  const { transactions, totalIncome, totalExpenses, budgets } = useFinance();

  const categoryData = budgets.map((b) => {
    const cat = defaultCategories.find((c) => c.name === b.category);
    return { name: b.category, value: b.spent, color: cat?.color ?? "hsl(221,83%,53%)" };
  }).filter((c) => c.value > 0);

  function downloadCSV() {
    const headers = ["Data", "Tipo", "Categoria", "Descrição", "Valor", "Conta", "Forma de Pagamento"];
    const rows = transactions.map((t) => [
      t.date, t.type === "income" ? "Receita" : "Despesa", t.category, t.description, t.amount.toFixed(2), t.account, t.paymentMethod,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-transacoes.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Análise financeira de março 2026</p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadCSV}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl shadow-card p-5">
          <span className="text-label">Total de Receitas</span>
          <p className="font-mono tabular-nums text-xl font-semibold text-success mt-1">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="bg-card rounded-xl shadow-card p-5">
          <span className="text-label">Total de Despesas</span>
          <p className="font-mono tabular-nums text-xl font-semibold text-destructive mt-1">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="bg-card rounded-xl shadow-card p-5">
          <span className="text-label">Economia Líquida</span>
          <p className="font-mono tabular-nums text-xl font-semibold mt-1">{formatCurrency(totalIncome - totalExpenses)}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-card p-5">
        <h2 className="text-heading mb-4">Receitas vs Despesas</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrendData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(215,16%,47%)" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(215,16%,47%)" }} tickFormatter={(v) => `R$${v / 1000}k`} />
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm">{cat.name}</span>
                </div>
                <span className="font-mono tabular-nums text-sm font-medium">{formatCurrency(cat.value)}</span>
              </div>
            ))}
            {categoryData.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma despesa registrada.</p>
            )}
          </div>
          {categoryData.length > 0 && (
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: "8px", fontSize: "13px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
