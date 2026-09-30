export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading">Configurações</h1>
        <p className="text-sm text-muted-foreground">Gerencie sua conta e preferências</p>
      </div>

      <div className="bg-card rounded-xl shadow-card p-5 space-y-4">
        <div>
          <h2 className="text-label mb-2">Perfil</h2>
          <p className="text-sm text-muted-foreground">
            Faça login para sincronizar seus dados entre dispositivos e acessar recursos premium.
          </p>
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
