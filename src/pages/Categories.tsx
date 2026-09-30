import { defaultCategories } from "@/lib/mock-data";

export default function Categories() {
  const expenseCategories = defaultCategories.filter((c) => c.type === "expense");
  const incomeCategories = defaultCategories.filter((c) => c.type === "income");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading">Categorias</h1>
        <p className="text-sm text-muted-foreground">Gerencie suas categorias de transação</p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-label mb-3">Categorias de Despesa</h2>
          <div className="bg-card rounded-xl shadow-card divide-y divide-border">
            {expenseCategories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-accent/50 transition-colors">
                <span className="text-lg">{cat.icon}</span>
                <span className="text-sm font-medium flex-1">{cat.name}</span>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-label mb-3">Categorias de Receita</h2>
          <div className="bg-card rounded-xl shadow-card divide-y divide-border">
            {incomeCategories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-accent/50 transition-colors">
                <span className="text-lg">{cat.icon}</span>
                <span className="text-sm font-medium flex-1">{cat.name}</span>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
