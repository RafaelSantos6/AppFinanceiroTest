import { useState } from "react";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency, Transaction } from "@/lib/mock-data";
import { TransactionForm } from "@/components/TransactionForm";
import { Search, Filter, Pencil, Trash2, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Transactions() {
  const { transactions, categories, deleteTransaction } = useFinance();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [adding, setAdding] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = transactions
    .filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (search && !t.description.toLowerCase().includes(search.toLowerCase()) && !t.category.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading">Transações</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} transações</p>
        </div>
        <Button onClick={() => setAdding(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Nova Transação
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar transações..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="income">Receitas</SelectItem>
            <SelectItem value="expense">Despesas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl shadow-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[1fr_120px_100px_140px_120px_80px] gap-4 px-5 py-3 border-b border-border text-label">
          <span>Descrição</span>
          <span>Categoria</span>
          <span>Data</span>
          <span>Conta</span>
          <span className="text-right">Valor</span>
          <span className="text-right">Ações</span>
        </div>

        <div className="divide-y divide-border">
          {filtered.map((tx) => {
            const cat = categories.find((c) => c.name === tx.category);
            return (
              <div
                key={tx.id}
                className="flex flex-col md:grid md:grid-cols-[1fr_120px_100px_140px_120px_80px] gap-1 md:gap-4 px-5 py-3.5 hover:bg-accent/50 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{cat?.icon ?? "📝"}</span>
                  <span className="text-sm font-medium truncate">{tx.description}</span>
                </div>
                <span className="text-sm text-muted-foreground hidden md:block truncate">{tx.category}</span>
                <span className="text-sm text-muted-foreground hidden md:block">
                  {new Date(tx.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                </span>
                <span className="text-sm text-muted-foreground hidden md:block truncate">{tx.account}</span>
                <span className={`font-mono tabular-nums text-sm font-semibold md:text-right ${tx.type === "income" ? "text-success" : "text-foreground"}`}>
                  {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                </span>
                <div className="hidden md:flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingTx(tx)} className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeletingId(tx.id)} className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Mobile meta + actions */}
                <div className="flex items-center justify-between md:hidden">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{tx.category}</span>
                    <span>·</span>
                    <span>{new Date(tx.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditingTx(tx)} className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-muted-foreground">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeletingId(tx.id)} className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-muted-foreground">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma transação encontrada.
            </p>
          )}
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {adding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
            onClick={() => setAdding(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "tween", ease: [0.2, 0, 0, 1], duration: 0.25 }}
              className="bg-card rounded-xl shadow-card w-full max-w-lg p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-heading">Nova Transação</h2>
                <button onClick={() => setAdding(false)} className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <TransactionForm onSubmit={() => setAdding(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingTx && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
            onClick={() => setEditingTx(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "tween", ease: [0.2, 0, 0, 1], duration: 0.25 }}
              className="bg-card rounded-xl shadow-card w-full max-w-lg p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-heading">Editar Transação</h2>
                <button onClick={() => setEditingTx(null)} className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <TransactionForm initial={editingTx} onSubmit={() => setEditingTx(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A transação será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deletingId) { deleteTransaction(deletingId); setDeletingId(null); } }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
