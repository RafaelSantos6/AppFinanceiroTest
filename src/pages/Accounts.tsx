import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFinance } from "@/contexts/FinanceContext";
import { formatCurrency, accountTypeLabels, Account } from "@/lib/mock-data";
import { Building2, Banknote, CreditCard, PiggyBank, Plus, Pencil, Trash2, X } from "lucide-react";
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

const iconMap = {
  bank: Building2,
  cash: Banknote,
  credit: CreditCard,
  savings: PiggyBank,
};

const accountTypes = ["bank", "cash", "credit", "savings"] as const;

function AccountForm({ initial, onSubmit, onCancel }: {
  initial?: Account;
  onSubmit: (data: Omit<Account, "id">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<Account["type"]>(initial?.type ?? "bank");
  const [balance, setBalance] = useState(initial?.balance?.toString() ?? "0");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onSubmit({ name, type, balance: parseFloat(balance) || 0 });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="text-label mb-1.5 block">Nome da Conta</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Nubank" required autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-label mb-1.5 block">Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as Account["type"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {accountTypes.map((t) => (
                <SelectItem key={t} value={t}>{accountTypeLabels[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-label mb-1.5 block">Saldo Inicial</Label>
          <Input type="number" step="0.01" value={balance} onChange={(e) => setBalance(e.target.value)} className="font-mono tabular-nums" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="flex-1">{initial ? "Atualizar" : "Criar Conta"}</Button>
      </div>
    </form>
  );
}

export default function Accounts() {
  const { accounts, addAccount, updateAccount, deleteAccount } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading">Contas</h1>
          <p className="text-sm text-muted-foreground">
            Patrimônio líquido:{" "}
            <span className="font-mono tabular-nums font-semibold text-foreground">
              {formatCurrency(totalBalance)}
            </span>
          </p>
        </div>
        <Button size="sm" onClick={() => { setShowForm(true); setEditingAccount(null); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {(showForm || editingAccount) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
            onClick={() => { setShowForm(false); setEditingAccount(null); }}
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
                <h2 className="text-heading">{editingAccount ? "Editar Conta" : "Nova Conta"}</h2>
                <button onClick={() => { setShowForm(false); setEditingAccount(null); }} className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <AccountForm
                initial={editingAccount ?? undefined}
                onSubmit={(data) => {
                  if (editingAccount) {
                    updateAccount(editingAccount.id, data);
                  } else {
                    addAccount(data);
                  }
                  setShowForm(false);
                  setEditingAccount(null);
                }}
                onCancel={() => { setShowForm(false); setEditingAccount(null); }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {accounts.map((account) => {
          const Icon = iconMap[account.type];
          const isNegative = account.balance < 0;
          return (
            <motion.div
              key={account.id}
              whileHover={{ y: -2 }}
              transition={{ type: "tween", ease: [0.2, 0, 0, 1], duration: 0.2 }}
              className="bg-card rounded-xl shadow-card p-5 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-primary">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{account.name}</p>
                    <p className="text-label">{accountTypeLabels[account.type]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setEditingAccount(account)} className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeletingId(account.id)} className="w-7 h-7 rounded-md bg-accent flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className={`font-mono tabular-nums text-2xl font-semibold ${isNegative ? "text-destructive" : "text-foreground"}`}>
                {formatCurrency(account.balance)}
              </div>
            </motion.div>
          );
        })}
        {accounts.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-2 text-center py-8">
            Nenhuma conta criada. Clique em "Nova Conta" para começar.
          </p>
        )}
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A conta será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deletingId) { deleteAccount(deletingId); setDeletingId(null); } }}
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
