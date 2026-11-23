import { useState, useEffect, useCallback } from "react";
import { api, ChildAccountSummary, CreateChildPayload } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldCheck, UserPlus, Trash2, Wallet, TrendingDown, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LOCAL_CHILDREN_KEY = "ledger_parental_children";

export function getLocalChildren(parentId: string): ChildAccountSummary[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_CHILDREN_KEY}_${parentId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalChildren(parentId: string, list: ChildAccountSummary[]) {
  localStorage.setItem(`${LOCAL_CHILDREN_KEY}_${parentId}`, JSON.stringify(list));
}

export function ParentalControlSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [childrenList, setChildrenList] = useState<ChildAccountSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [spendingLimit, setSpendingLimit] = useState("");
  const [initialBalance, setInitialBalance] = useState("");

  const parentId = user?.id || "demo-user-1";

  const loadChildren = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getChildren();
      setChildrenList(data);
      saveLocalChildren(parentId, data);
    } catch {
      setChildrenList(getLocalChildren(parentId));
    } finally {
      setLoading(false);
    }
  }, [parentId]);

  useEffect(() => {
    if (user?.role !== "CHILD") {
      loadChildren();
    }
  }, [user?.role, loadChildren]);

  if (user?.role === "CHILD") {
    return (
      <div className="bg-card rounded-xl shadow-card p-5 space-y-3 border border-primary/20">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h2 className="text-label">Controle Parental Ativo</h2>
          <Badge variant="secondary">Conta Supervisionada</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Esta conta está vinculada a um responsável titular, que pode acompanhar seu saldo e histórico de gastos.
        </p>
        {user.spendingLimit && (
          <p className="text-sm font-medium">
            Limite mensal recomendado pelo responsável:{" "}
            <span className="text-primary font-mono">{formatCurrency(user.spendingLimit)}</span>
          </p>
        )}
      </div>
    );
  }

  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 6) {
      toast.error("Preencha nome, e-mail válido e senha com no mínimo 6 caracteres.");
      return;
    }

    const payload: CreateChildPayload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      spendingLimit: spendingLimit ? Number(spendingLimit) : null,
      initialBalance: initialBalance ? Number(initialBalance) : 0,
    };

    setSubmitting(true);
    try {
      const res = await api.createChildAccount(payload);
      const created: ChildAccountSummary = {
        ...res.child,
        totalBalance: payload.initialBalance || 0,
        totalExpenses: 0,
        totalIncome: 0,
        transactionCount: 0,
      };
      const updated = [...childrenList, created];
      setChildrenList(updated);
      saveLocalChildren(parentId, updated);
      toast.success("Conta da criança criada com sucesso!");
      setName("");
      setEmail("");
      setPassword("");
      setSpendingLimit("");
      setInitialBalance("");
      setShowForm(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      const isOffline =
        msg.includes("Failed to fetch") ||
        msg.includes("NetworkError") ||
        msg.includes("Load failed") ||
        msg.includes("Erro ao criar conta da criança");

      if (isOffline && !msg.includes("Já existe")) {
        const localChild: ChildAccountSummary = {
          id: `child-${Date.now()}`,
          name: payload.name,
          email: payload.email,
          role: "CHILD",
          parentId,
          spendingLimit: payload.spendingLimit ?? null,
          totalBalance: payload.initialBalance || 0,
          totalExpenses: 0,
          totalIncome: 0,
          transactionCount: 0,
        };
        const updated = [...childrenList, localChild];
        setChildrenList(updated);
        saveLocalChildren(parentId, updated);
        toast.success("Conta da criança criada (modo local)!");
        setName("");
        setEmail("");
        setPassword("");
        setSpendingLimit("");
        setInitialBalance("");
        setShowForm(false);
      } else {
        toast.error(msg || "Não foi possível criar a conta da criança.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChild = async (childId: string, childName: string) => {
    try {
      await api.deleteChildAccount(childId);
    } catch {
      // Fallback local
    }
    const updated = childrenList.filter((c) => c.id !== childId);
    setChildrenList(updated);
    saveLocalChildren(parentId, updated);
    toast.success(`Conta de ${childName} removida.`);
  };

  return (
    <div className="bg-card rounded-xl shadow-card p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h2 className="text-label">Controle Parental (Contas de Crianças)</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Crie uma conta com login próprio para seu filho(a) e acompanhe os gastos direto pelo seletor no topo do Painel.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setShowForm((prev) => !prev)}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          {showForm ? "Cancelar" : "Nova Conta de Criança"}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreateChild}
          className="p-4 rounded-xl bg-accent/30 border border-border/60 space-y-4"
        >
          <h3 className="text-sm font-semibold">Cadastrar Conta para Criança</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="child-name">Nome da Criança</Label>
              <Input
                id="child-name"
                placeholder="Ex: Lucas"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="child-email">E-mail de Login da Criança</Label>
              <Input
                id="child-email"
                type="email"
                placeholder="Ex: lucas@familia.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="child-password">Senha de Acesso (mín. 6 caracteres)</Label>
              <Input
                id="child-password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="child-limit">Limite Mensal de Gastos (R$ - Opcional)</Label>
              <Input
                id="child-limit"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 200.00"
                value={spendingLimit}
                onChange={(e) => setSpendingLimit(e.target.value)}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="child-balance">Saldo Inicial / Mesada Inicial (R$ - Opcional)</Label>
              <Input
                id="child-balance"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 50.00"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
              Fechar
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Criando..." : "Criar Conta da Criança"}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground py-3">Carregando contas vinculadas...</p>
      ) : childrenList.length === 0 ? (
        <div className="text-center py-6 px-4 rounded-lg border border-dashed border-border">
          <p className="text-sm text-muted-foreground">
            Nenhuma conta de criança vinculada ainda. Clique em <strong>Nova Conta de Criança</strong> para começar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {childrenList.map((child) => (
            <div
              key={child.id}
              className="p-4 rounded-xl border border-border/70 bg-accent/20 flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold">
                    {child.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{child.name}</h4>
                      <Badge variant="secondary" className="text-[10px]">
                        Dependente
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{child.email}</p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  title={`Remover conta de ${child.name}`}
                  onClick={() => handleDeleteChild(child.id, child.name)}
                  className="text-muted-foreground hover:text-destructive h-8 w-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
                <div className="flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-primary" />
                  <span className="text-muted-foreground">Saldo:</span>
                  <span className="font-mono font-semibold">{formatCurrency(child.totalBalance)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-destructive" />
                  <span className="text-muted-foreground">Gastos:</span>
                  <span className="font-mono font-semibold">{formatCurrency(child.totalExpenses)}</span>
                </div>
              </div>

              {child.spendingLimit ? (
                <div className="text-xs text-muted-foreground">
                  Limite mensal definido:{" "}
                  <span className="font-mono font-medium text-foreground">
                    {formatCurrency(child.spendingLimit)}
                  </span>
                </div>
              ) : null}

              <Button
                variant="outline"
                size="sm"
                className="w-full flex items-center justify-center gap-2 text-xs"
                onClick={() => navigate(`/?childId=${child.id}`)}
              >
                <Eye className="w-3.5 h-3.5" />
                Ver Gastos no Painel
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
