import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency, Goal } from "@/lib/mock-data";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Trophy,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

const GOAL_COLORS = [
  "hsl(221, 83%, 53%)", // Azul
  "hsl(142, 71%, 45%)", // Verde
  "hsl(262, 83%, 58%)", // Roxo
  "hsl(25, 95%, 53%)",  // Laranja
  "hsl(330, 81%, 60%)", // Rosa
  "hsl(199, 89%, 48%)", // Ciano
  "hsl(38, 92%, 50%)",  // Amarelo
];

const GOAL_ICONS = ["🎯", "🛡️", "✈️", "🚗", "🏠", "💻", "🎓", "💍", "📈", "🏖️"];

function GoalForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Goal;
  onSubmit: (data: Omit<Goal, "id">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(initial?.targetAmount?.toString() ?? "");
  const [currentAmount, setCurrentAmount] = useState(initial?.currentAmount?.toString() ?? "0");
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? "🎯");
  const [color, setColor] = useState(initial?.color ?? GOAL_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount) return;
    onSubmit({
      name: name.trim(),
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      deadline: deadline || null,
      icon,
      color,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="goal-name" className="text-label mb-1.5 block">
          Nome da Meta
        </Label>
        <Input
          id="goal-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Reserva de Emergência"
          required
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="goal-target" className="text-label mb-1.5 block">
            Valor Alvo (R$)
          </Label>
          <Input
            id="goal-target"
            type="number"
            step="0.01"
            min="0.01"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="10000,00"
            className="font-mono tabular-nums"
            required
          />
        </div>
        <div>
          <Label htmlFor="goal-current" className="text-label mb-1.5 block">
            Já Guardado (R$)
          </Label>
          <Input
            id="goal-current"
            type="number"
            step="0.01"
            min="0"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(e.target.value)}
            placeholder="0,00"
            className="font-mono tabular-nums"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="goal-deadline" className="text-label mb-1.5 block">
          Prazo Desejado (Opcional)
        </Label>
        <Input
          id="goal-deadline"
          type="date"
          value={deadline ?? ""}
          onChange={(e) => setDeadline(e.target.value)}
        />
      </div>

      <div>
        <Label className="text-label mb-1.5 block">Ícone</Label>
        <div className="flex flex-wrap gap-2">
          {GOAL_ICONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setIcon(emoji)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-colors ${
                icon === emoji
                  ? "bg-primary/15 border-2 border-primary"
                  : "bg-accent hover:bg-accent/80 border border-transparent"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-label mb-1.5 block">Cor</Label>
        <div className="flex flex-wrap gap-2">
          {GOAL_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full border-2 transition-transform ${
                color === c ? "border-foreground scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1">
          {initial ? "Atualizar Meta" : "Criar Meta"}
        </Button>
      </div>
    </form>
  );
}

export default function Goals() {
  const { goals = [], addGoal, updateGoal, deleteGoal } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
  const [depositMode, setDepositMode] = useState<"deposit" | "withdraw">("deposit");
  const [depositAmount, setDepositAmount] = useState("");

  const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallPct = totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal || !depositAmount) return;
    const value = parseFloat(depositAmount);
    if (isNaN(value) || value <= 0) return;

    const delta = depositMode === "deposit" ? value : -value;
    const updatedAmount = Math.max(0, depositGoal.currentAmount + delta);
    updateGoal(depositGoal.id, { currentAmount: updatedAmount });
    setDepositGoal(null);
    setDepositAmount("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-heading">Metas Financeiras</h1>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(totalSaved)} guardados de {formatCurrency(totalTarget)} em objetivos
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setShowForm(true);
            setEditingGoal(null);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {/* Resumo Geral */}
      {totalTarget > 0 && (
        <div className="bg-card rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-label">Progresso Geral das Metas</span>
            <span className="font-mono tabular-nums text-sm font-medium">
              {Math.round(overallPct)}%
            </span>
          </div>
          <div className="h-3 bg-accent rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
              className="h-full bg-primary rounded-full"
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground font-mono tabular-nums">
            <span>{formatCurrency(totalSaved)} acumulado</span>
            <span>{formatCurrency(Math.max(totalTarget - totalSaved, 0))} restante</span>
          </div>
        </div>
      )}

      {/* Modal Criar / Editar */}
      <AnimatePresence>
        {(showForm || editingGoal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
            onClick={() => {
              setShowForm(false);
              setEditingGoal(null);
            }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "tween", ease: [0.2, 0, 0, 1], duration: 0.25 }}
              className="bg-card rounded-xl shadow-card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-heading">
                  {editingGoal ? "Editar Meta" : "Nova Meta"}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingGoal(null);
                  }}
                  className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <GoalForm
                initial={editingGoal ?? undefined}
                onSubmit={(data) => {
                  if (editingGoal) {
                    updateGoal(editingGoal.id, data);
                  } else {
                    addGoal(data);
                  }
                  setShowForm(false);
                  setEditingGoal(null);
                }}
                onCancel={() => {
                  setShowForm(false);
                  setEditingGoal(null);
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Rápido Aportar / Resgatar */}
      <AnimatePresence>
        {depositGoal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
            onClick={() => setDepositGoal(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "tween", ease: [0.2, 0, 0, 1], duration: 0.25 }}
              className="bg-card rounded-xl shadow-card w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-heading flex items-center gap-2">
                  <span>{depositGoal.icon}</span>
                  <span>{depositGoal.name}</span>
                </h2>
                <button
                  onClick={() => setDepositGoal(null)}
                  className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleDepositSubmit} className="space-y-4">
                <div className="flex gap-2 p-1 bg-accent rounded-lg">
                  <button
                    type="button"
                    onClick={() => setDepositMode("deposit")}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-all ${
                      depositMode === "deposit"
                        ? "bg-card shadow-sm text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 text-success" />
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDepositMode("withdraw")}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1 transition-all ${
                      depositMode === "withdraw"
                        ? "bg-card shadow-sm text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 text-destructive" />
                    Resgatar
                  </button>
                </div>

                <div>
                  <Label htmlFor="deposit-amount" className="text-label mb-1.5 block">
                    Valor (R$)
                  </Label>
                  <Input
                    id="deposit-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="font-mono tabular-nums text-lg"
                    required
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Saldo atual na meta: {formatCurrency(depositGoal.currentAmount)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setDepositGoal(null)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    Confirmar
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de Metas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const pct =
            goal.targetAmount > 0
              ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              : 0;
          const isCompleted = goal.currentAmount >= goal.targetAmount && goal.targetAmount > 0;
          const remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);

          return (
            <motion.div
              key={goal.id}
              whileHover={{ y: -2 }}
              transition={{ type: "tween", ease: [0.2, 0, 0, 1], duration: 0.2 }}
              className="bg-card rounded-xl shadow-card p-5 group flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                      style={{ backgroundColor: `${goal.color}20` }}
                    >
                      {goal.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">{goal.name}</h3>
                        {isCompleted && (
                          <Badge className="bg-success text-white text-[10px] py-0 h-4 px-1.5 gap-1">
                            <Trophy className="w-2.5 h-2.5" /> Concluída
                          </Badge>
                        )}
                      </div>
                      {goal.deadline && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          Prazo:{" "}
                          {new Date(goal.deadline + "T12:00:00Z").toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      aria-label="Editar meta"
                      onClick={() => setEditingGoal(goal)}
                      className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      aria-label="Excluir meta"
                      onClick={() => setDeletingId(goal.id)}
                      className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="h-2.5 bg-accent rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: goal.color }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs font-mono tabular-nums">
                  <span className="font-semibold text-foreground">
                    {formatCurrency(goal.currentAmount)}
                  </span>
                  <span className="text-muted-foreground">
                    de {formatCurrency(goal.targetAmount)} ({Math.round(pct)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/60">
                <span className="text-xs text-muted-foreground">
                  {isCompleted
                    ? "Objetivo alcançado!"
                    : `Faltam ${formatCurrency(remaining)}`}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => {
                    setDepositGoal(goal);
                    setDepositMode("deposit");
                    setDepositAmount("");
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Aportar
                </Button>
              </div>
            </motion.div>
          );
        })}

        {goals.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-2 text-center py-8">
            Nenhuma meta financeira definida. Clique em &quot;Nova Meta&quot; para criar sua primeira caixinha.
          </p>
        )}
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir meta financeira?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A meta será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) {
                  deleteGoal(deletingId);
                  setDeletingId(null);
                }
              }}
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
