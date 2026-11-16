import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie sua conta e preferências</p>
      </div>

      <div className="bg-card rounded-xl shadow-card p-5 space-y-4">
        <div>
          <h2 className="text-label mb-2">Perfil do Usuário</h2>
          {user ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-accent/40 border border-border/60">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={logout}
                className="flex items-center gap-2 self-start sm:self-auto"
              >
                <LogOut className="w-4 h-4" />
                Encerrar Sessão
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Faça login para sincronizar seus dados entre dispositivos e acessar recursos premium.
            </p>
          )}
        </div>
        <div className="pt-2 border-t border-border">
          <h2 className="text-label mb-2">Preferências</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Moeda</span>
              <span className="text-muted-foreground">BRL (R$)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Formato de Data</span>
              <span className="text-muted-foreground">DD/MM/AAAA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
