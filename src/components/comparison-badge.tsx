"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ComparisonBadgeProps {
  changePercent: number | null;
  previousDate: string | null;
}

export default function ComparisonBadge({
  changePercent,
  previousDate,
}: ComparisonBadgeProps) {
  if (changePercent === null || changePercent === undefined) {
    return (
      <Badge variant="secondary" className="text-xs gap-1">
        <Minus className="h-3 w-3" />
        İlk Kayıt
      </Badge>
    );
  }

  const isPositive = changePercent > 0;
  const isNeutral = changePercent === 0;
  const formatted = Math.abs(changePercent).toFixed(1);

  if (isNeutral) {
    return (
      <Badge variant="secondary" className="text-xs gap-1">
        <Minus className="h-3 w-3" />
        %0 Değişim
      </Badge>
    );
  }

  return (
    <Badge
      className={`text-xs gap-1 ${
        isPositive
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400"
          : "bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-400"
      }`}
    >
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {isPositive ? "+" : "-"}%{formatted}
      {previousDate && (
        <span className="opacity-60 ml-1">
          vs {new Date(previousDate).toLocaleDateString("tr-TR")}
        </span>
      )}
    </Badge>
  );
}
