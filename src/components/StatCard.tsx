import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/mock-data";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  variant?: "default" | "success" | "destructive";
  isCurrency?: boolean;
}

export function StatCard({ label, value, icon: Icon, trend, variant = "default", isCurrency = true }: StatCardProps) {
  const iconColor =
    variant === "success"
      ? "text-success"
      : variant === "destructive"
      ? "text-destructive"
      : "text-primary";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "tween", ease: [0.2, 0, 0, 1], duration: 0.2 }}
      className="bg-card rounded-xl p-5 shadow-card"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-label">{label}</span>
        <div className={`w-8 h-8 rounded-lg bg-accent flex items-center justify-center ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="font-mono tabular-nums text-2xl font-semibold text-card-foreground tracking-tight">
        {isCurrency ? formatCurrency(value) : `${value.toFixed(1)}%`}
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          <span
            className={`text-xs font-medium ${
              trend.positive ? "text-success" : "text-destructive"
            }`}
          >
            {trend.positive ? "+" : ""}
            {trend.value}%
          </span>
          <span className="text-xs text-muted-foreground">vs mês anterior</span>
        </div>
      )}
    </motion.div>
  );
}
