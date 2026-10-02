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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function Reports() {
  const { transactions, totalIncome, totalExpenses } = useFinance();

  const dynamicTrend = calculateMonthlyTrend(transactions);
  const { toast } = useToast();

  // Calcula gastos reais por categoria diretamente das transações
  const categoryExpensesMap = new Map<string, number>();
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      const current = categoryExpensesMap.get(t.category) || 0;
      categoryExpensesMap.set(t.category, current + t.amount);
    });

  const categoryData = Array.from(categoryExpensesMap.entries()).map(([name, value]) => {
    const cat = defaultCategories.find((c) => c.name === name);
    return {
      name,
      value,
      color: cat?.color ?? "hsl(221,83%,53%)",
    };
  });

  function downloadCSV() {
    const headers = ["Data", "Descrição", "Categoria", "Conta", "Tipo (Receita/Despesa)", "Valor (R$)"];
    const rows = transactions.map((t) => {
      // Formatar a data (YYYY-MM-DD -> DD/MM/AAAA)
      const dateParts = t.date.split("-");
      const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : t.date;
      
      // Formatar o valor (Substitui ponto por vírgula para manter padrão local no excel)
      const formattedValue = t.amount.toFixed(2).replace(".", ",");
      
      return [
        formattedDate,
        `"${t.description.replace(/"/g, '""')}"`,
        `"${t.category}"`,
        `"${t.account}"`,
        t.type === "income" ? "Receita" : "Despesa",
        formattedValue,
      ];
    });
    
    // Adicionar BOM (\uFEFF) para garantir leitura UTF-8 no Excel
    const csv = "\uFEFF" + [headers, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    a.download = `relatorio-financeiro-${yyyy}-${mm}.csv`;
    
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exportação concluída",
      description: "O relatório CSV foi gerado e baixado com sucesso.",
    });
  }

  const currentMonthYear = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-heading">Relatórios e Análise</h1>
          <p className="text-sm text-muted-foreground capitalize">
            Visão consolidada · {currentMonthYear}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadCSV}
          disabled={transactions.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl shadow-card p-5">
          <span className="text-label">Total de Receitas</span>
          <p className="font-mono tabular-nums text-xl font-semibold text-success mt-1">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div className="bg-card rounded-xl shadow-card p-5">
          <span className="text-label">Total de Despesas</span>
          <p className="font-mono tabular-nums text-xl font-semibold text-destructive mt-1">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        <div className="bg-card rounded-xl shadow-card p-5">
          <span className="text-label">Economia Líquida</span>
          <p
            className={`font-mono tabular-nums text-xl font-semibold mt-1 ${
              totalIncome - totalExpenses >= 0 ? "text-foreground" : "text-destructive"
            }`}
          >
            {formatCurrency(totalIncome - totalExpenses)}
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-heading">Receitas vs Despesas</h2>
          <span className="text-xs text-muted-foreground">Histórico dinâmico dos últimos 6 meses</span>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dynamicTrend} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(215,16%,47%)" }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(215,16%,47%)" }}
                tickFormatter={(v) => `R$${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  background: "hsl(0,0%,100%)",
                  border: "1px solid hsl(214,32%,91%)",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="income" name="Receitas" fill="hsl(142,71%,45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Despesas" fill="hsl(0,84%,60%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-card p-5">
        <h2 className="text-heading mb-4">Gastos por Categoria</h2>
        {categoryData.length === 0 ? (
          <div className="text-center py-10 px-4 text-muted-foreground">
            <p className="text-sm font-medium">Nenhuma despesa registrada até o momento</p>
            <p className="text-xs mt-1">Ao lançar novas despesas, a distribuição gráfica aparecerá aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-3">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm">{cat.name}</span>
                  </div>
                  <span className="font-mono tabular-nums text-sm font-medium">
                    {formatCurrency(cat.value)}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-56 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

