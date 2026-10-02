import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFinance } from "@/contexts/FinanceContext";
import { useToast } from "@/components/ui/use-toast";

const COLORS = [
  "hsl(25, 95%, 53%)", // Laranja
  "hsl(221, 83%, 53%)", // Azul
  "hsl(262, 83%, 58%)", // Roxo
  "hsl(330, 81%, 60%)", // Rosa
  "hsl(142, 71%, 45%)", // Verde
  "hsl(38, 92%, 50%)", // Amarelo
  "hsl(199, 89%, 48%)", // Ciano
  "hsl(47, 95%, 53%)", // Dourado
  "hsl(0, 84%, 60%)", // Vermelho
];

const EMOJIS = ["🍔", "🚗", "🏠", "🎮", "💊", "🛒", "⚡", "📚", "💰", "💻", "📈", "✈️", "🐾", "🔧"];

export default function Categories() {
  const { categories, addCategory, deleteCategory } = useFinance();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [icon, setIcon] = useState("🏷️");
  const [color, setColor] = useState(COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await addCategory({ name, type, icon, color });
      toast({
        title: "Categoria criada",
        description: `A categoria ${name} foi adicionada com sucesso.`,
      });
      setIsOpen(false);
      setName("");
      setIcon("🏷️");
      setColor(COLORS[0]);
    } catch (error) {
      toast({
        title: "Erro ao criar",
        description: "Ocorreu um erro ao tentar criar a categoria.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, catName: string) => {
    try {
      await deleteCategory(id);
      toast({
        title: "Categoria excluída",
        description: `A categoria ${catName} foi removida com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a categoria.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-heading">Categorias</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas categorias de transação</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Categoria</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Categoria</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Ex: Assinaturas"
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <RadioGroup 
                  value={type} 
                  onValueChange={(val) => setType(val as "expense" | "income")}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="expense" id="expense" />
                    <Label htmlFor="expense" className="cursor-pointer">Despesa</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="income" id="income" />
                    <Label htmlFor="income" className="cursor-pointer">Receita</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Ícone / Emoji</Label>
                <div className="flex items-center gap-2 mb-2">
                  <Input 
                    value={icon} 
                    onChange={(e) => setIcon(e.target.value)} 
                    className="w-16 text-center text-xl" 
                    maxLength={2}
                  />
                  <span className="text-sm text-muted-foreground">Ou escolha um:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setIcon(e)}
                      className={`w-8 h-8 rounded hover:bg-accent flex items-center justify-center text-lg ${icon === e ? 'bg-accent border border-primary' : ''}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-primary ring-2 ring-primary/20 ring-offset-1 ring-offset-background' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar Categoria"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-label mb-3">Categorias de Despesa</h2>
          <div className="bg-card rounded-xl shadow-card divide-y divide-border">
            {expenseCategories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-accent/50 transition-colors group">
                <span className="text-lg">{cat.icon}</span>
                <span className="text-sm font-medium flex-1">{cat.name}</span>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(cat.id, cat.name)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {expenseCategories.length === 0 && (
              <div className="px-5 py-6 text-center text-muted-foreground text-sm">
                Nenhuma categoria de despesa cadastrada.
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-label mb-3">Categorias de Receita</h2>
          <div className="bg-card rounded-xl shadow-card divide-y divide-border">
            {incomeCategories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-accent/50 transition-colors group">
                <span className="text-lg">{cat.icon}</span>
                <span className="text-sm font-medium flex-1">{cat.name}</span>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(cat.id, cat.name)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {incomeCategories.length === 0 && (
              <div className="px-5 py-6 text-center text-muted-foreground text-sm">
                Nenhuma categoria de receita cadastrada.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
