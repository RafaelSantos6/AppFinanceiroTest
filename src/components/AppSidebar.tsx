import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  BarChart3,
  Tags,
  Settings,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Painel" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Transações" },
  { to: "/accounts", icon: Wallet, label: "Contas" },
  { to: "/budgets", icon: Target, label: "Orçamentos" },
  { to: "/reports", icon: BarChart3, label: "Relatórios" },
  { to: "/categories", icon: Tags, label: "Categorias" },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-border bg-card h-screen fixed left-0 top-0 z-30">
      <div className="p-6 border-b border-border">
        <h1 className="text-heading font-semibold tracking-tight">
          <span className="text-primary">Ledger</span>OS
        </h1>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <NavLink
          to="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
            location.pathname === "/settings"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <Settings className="w-4 h-4" />
          Configurações
        </NavLink>
      </div>
    </aside>
  );
}
