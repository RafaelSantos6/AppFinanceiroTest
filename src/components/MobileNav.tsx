import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  BarChart3,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Painel" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Transações" },
  { to: "/accounts", icon: Wallet, label: "Contas" },
  { to: "/budgets", icon: Target, label: "Orçam." },
  { to: "/reports", icon: BarChart3, label: "Relat." },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border px-2 pb-safe">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
