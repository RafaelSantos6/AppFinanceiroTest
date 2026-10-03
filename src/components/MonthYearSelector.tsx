import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFinance } from "@/contexts/FinanceContext";

export function MonthYearSelector() {
  const { selectedMonth, setSelectedMonth } = useFinance();

  const [year, month] = selectedMonth.split("-").map(Number);
  const date = new Date(year, month - 1, 1);

  const handlePrev = () => {
    const prev = new Date(year, month - 2, 1);
    setSelectedMonth(prev.toISOString().slice(0, 7));
  };

  const handleNext = () => {
    const next = new Date(year, month, 1);
    setSelectedMonth(next.toISOString().slice(0, 7));
  };

  const formatted = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-2 py-1 shadow-sm w-fit">
      <button onClick={handlePrev} className="p-1 rounded hover:bg-accent text-muted-foreground transition-colors">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium w-32 text-center capitalize">{formatted}</span>
      <button onClick={handleNext} className="p-1 rounded hover:bg-accent text-muted-foreground transition-colors">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
