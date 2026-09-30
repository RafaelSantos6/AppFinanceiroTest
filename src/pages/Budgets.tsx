import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency, defaultCategories, Budget } from "@/lib/mock-data";
import { AlertTriangle, Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function BudgetForm({ initial, existingCategories, onSubmit, onCancel }: {
  initial?: Budget;
  existingCategories: string[];
  onSubmit: (data: { category: string; limit: number }) => void;
  onCancel: () => void;
}) {
  const [category, setCategory] = useState(initial?.category ?? "");
  const [limit, setLimit] = useState(initial?.limit?.toString() ?? "");

  const availableCategories = defaultCategories
    .filter((c) => c.type === "expense")
    .filter((c) => initial?.category === c.name || !existingCategories.includes(c.name));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !limit) return;
    onSubmit({ category, limit: parseFloat(limit) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-label mb-1.5 block">Categoria</Label>
        <Select value={category} onValueChange={setCategory} disabled={!!initial}>
          <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
          <SelectContent>
            {availableCategories.map((c) => (
              <SelectItem key={c.id} value={c.name}>{c.icon} {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-label mb-1.5 block">Limite Mensal</Label>
        <Input type="number" step="0.01" value={limit} onChange={(e) => setLimit(e.target.value)} className="font-mono tabular-nums" placeholder="0,00" required autoFocus />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="flex-1">{initial ? "Atualizar" : "Criar Orçamento"}</Button>
      </div>
    </form>
  );
}

export default function Budgets() {
  const { budgets, addBudget, updateBudget, deleteBudget } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const existingCategories = budgets.map((b) => b.category);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading">Orçamentos</h1>
          <p className="text-sm text-muted-foreground">
            Março 2026 · {formatCurrency(totalSpent)} de {formatCurrency(totalBudget)} usado
          </p>
        </div>
        <Button size="sm" onClick={() => { setShowForm(true); setEditingBudget(null); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Orçamento
        </Button>
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {(showForm || editingBudget) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
            onClick={() => { setShowForm(false); setEditingBudget(null); }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "tween", ease: [0.2, 0, 0, 1], duration: 0.25 }}
              className="bg-card rounded-xl shadow-card w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-heading">{editingBudget ? "Editar Orçamento" : "Novo Orçamento"}</h2>
                <button onClick={() => { setShowForm(false); setEditingBudget(null); }} className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <BudgetForm
                initial={editingBudget ?? undefined}
                existingCategories={existingCategories}
                onSubmit={(data) => {
                  if (editingBudget) {
                    updateBudget(editingBudget.id, { limit: data.limit });
                  } else {
                    addBudget({ ...data, spent: 0 });
                  }
                  setShowForm(false);
                  setEditingBudget(null);
                }}
                onCancel={() => { setShowForm(false); setEditingBudget(null); }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overall progress */}
      {totalBudget > 0 && (
        <div className="bg-card rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-label">Orçamento Geral</span>
            <span className="font-mono tabular-nums text-sm font-medium">
              {Math.round((totalSpent / totalBudget) * 100)}%
            </span>
          </div>
          <div className="h-3 bg-accent rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
              transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
              className="h-full bg-primary rounded-full"
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground font-mono tabular-nums">
            <span>{formatCurrency(totalSpent)} gasto</span>
            <span>{formatCurrency(totalBudget - totalSpent)} restante</span>
          </div>
        </div>
      )}

      {/* Per-category budgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {budgets.map((budget) => {
          const pct = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
          const isWarning = pct >= 70 && pct < 90;
          const isDanger = pct >= 90;
          const cat = defaultCategories.find((c) => c.name === budget.category);

          return (
            <motion.div
              key={budget.id}
              whileHover={{ y: -2 }}
              transition={{ type: "tween", ease: [0.2, 0, 0, 1], duration: 0.2 }}
              className="bg-card rounded-xl shadow-card p-5 group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">{cat?.icon ?? "📂"}</span>
                  <span className="text-sm font-medium">{budget.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isDanger && (
                    <div className="flex items-center gap-1 text-destructive">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Excedido</span>
                    </div>
                  )}
                  {isWarning && !isDanger && (
                    <div className="flex items-center gap-1 text-warning">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Quase no limite</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditingBudget(budget)} className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={() => setDeletingId(budget.id)} className="w-6 h-6 rounded-md bg-accent flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-2 bg-accent rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.min(pct, 100)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: isDanger ? "hsl(0,84%,60%)" : isWarning ? "hsl(38,92%,50%)" : cat?.color ?? "hsl(221,83%,53%)",
                  }}
                />
              </div>

              <div className="flex justify-between text-xs text-muted-foreground font-mono tabular-nums">
                <span>{formatCurrency(budget.spent)}</span>
                <span>{formatCurrency(budget.limit)}</span>
              </div>
            </motion.div>
          );
        })}
        {budgets.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-2 text-center py-8">
            Nenhum orçamento definido. Clique em "Novo Orçamento" para começar.
          </p>
        )}
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O orçamento será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deletingId) { deleteBudget(deletingId); setDeletingId(null); } }}
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
