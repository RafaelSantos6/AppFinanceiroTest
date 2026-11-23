import { useEffect, useState } from "react";
import { api, ChildAccountSummary, ChildOverview } from "@/lib/api";
import { formatCurrency } from "@/lib/mock-data";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";

interface ChildDashboardViewProps {
  child: ChildAccountSummary;
  onBack: () => void;
}

export function ChildDashboardView({ child, onBack }: ChildDashboardViewProps) {
  const [overview, setOverview] = useState<ChildOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .getChildOverview(child.id)
      .then((data) => {
        if (active) setOverview(data);
      })
      .catch(() => {
        if (active) {
          setOverview({
            child: {
              id: child.id,
              name: child.name,
              email: child.email,
              role: "CHILD",
              parentId: child.parentId,
              spendingLimit: child.spendingLimit,
            },
            totalBalance: child.totalBalance,
            totalExpenses: child.totalExpenses,
            totalIncome: child.totalIncome,
            accounts: [],
            transactions: [],
            goals: [],
            spendingByCategory: [],
          });
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [child]);

  const totalBalance = overview ? overview.totalBalance : child.totalBalance;
  const totalExpenses = overview ? overview.totalExpenses : child.totalExpenses;
  const totalIncome = overview ? overview.totalIncome : child.totalIncome;
  const limit = overview?.child.spendingLimit ?? child.spendingLimit ?? null;
  const limitPct = limit && limit > 0 ? Math.min((totalExpenses / limit) * 100, 100) : 0;
  const isOverLimit = limit && limit > 0 ? totalExpenses > limit : false;

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-primary/10 border border-primary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
            {child.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">
                Controle Parental: Gastos de {child.name}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                Visão do Responsável
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Conta vinculada ({child.email}) · Visualização somente leitura
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Minha Conta
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={`Saldo de ${child.name}`} value={totalBalance} icon={Wallet} />
        <StatCard
          label="Total de Gastos"
          value={totalExpenses}
          icon={TrendingDown}
          variant="destructive"
        />
        <StatCard
          label="Mesada / Receitas"
          value={totalIncome}
          icon={TrendingUp}
          variant="success"
        />
      </div>

      {limit && limit > 0 && (
        <div className="bg-card rounded-xl shadow-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-heading text-base">Limite de Gastos Definido</h2>
              {isOverLimit && (
                <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                  <AlertTriangle className="w-3 h-3" />
                  Limite Excedido
                </Badge>
              )}
            </div>
            <span className="text-sm font-mono tabular-nums">
              {formatCurrency(totalExpenses)} / {formatCurrency(limit)}
            </span>
          </div>
          <div className="h-2.5 bg-accent rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${limitPct}%`,
                backgroundColor:
                  isOverLimit || limitPct > 90
                    ? "hsl(0,84%,60%)"
                    : limitPct > 70
                    ? "hsl(38,92%,50%)"
                    : "hsl(142,71%,45%)",
              }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl shadow-card p-5">
          <h2 className="text-heading mb-4">Gastos por Categoria</h2>
          {loading ? (
            <p className="text-sm text-muted-foreground py-4">Carregando categorias...</p>
          ) : overview && overview.spendingByCategory.length > 0 ? (
            <div className="space-y-3">
              {overview.spendingByCategory.map((item) => {
                const pct =
                  totalExpenses > 0 ? Math.min((item.amount / totalExpenses) * 100, 100) : 0;
                return (
                  <div key={item.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium flex items-center gap-1.5">
                        <span>{item.icon}</span>
                        <span>{item.category}</span>
                      </span>
                      <span className="text-xs font-mono tabular-nums text-muted-foreground">
                        {formatCurrency(item.amount)} ({Math.round(pct)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-accent rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum gasto por categoria registrado por {child.name}.
            </p>
          )}
        </div>

        <div className="lg:col-span-2 bg-card rounded-xl shadow-card">
          <div className="p-5 border-b border-border">
            <h2 className="text-heading">Histórico de Gastos e Movimentações de {child.name}</h2>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Carregando transações de {child.name}...
              </p>
            ) : overview && overview.transactions.length > 0 ? (
              overview.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-accent/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.category} · {tx.account} ·{" "}
                      {new Date(tx.date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`font-mono tabular-nums text-sm font-semibold ${
                      tx.type === "income" ? "text-success" : "text-foreground"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {child.name} ainda não registrou nenhuma transação.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
