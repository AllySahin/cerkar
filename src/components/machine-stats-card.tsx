"use client";

import { useState } from "react";
import type { MachineStat, MachineLogSummary } from "@/lib/actions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Cog, Clock, BarChart3, TrendingUp, ChevronRight } from "lucide-react";
import AddMachineDialog from "@/components/add-machine-dialog";
import DeleteMachineButton from "@/components/delete-machine-button";
import EditMachineButton from "@/components/edit-machine-button";

interface Props {
  machine: MachineStat;
  isAdmin: boolean;
}

function getEfficiencyColors(eff: number | null): {
  bg: string;
  border: string;
  badge: string;
  text: string;
  dot: string;
} {
  if (eff === null)
    return {
      bg: "bg-gradient-to-br from-zinc-800/60 to-zinc-900/80",
      border: "border-zinc-700/50",
      badge: "bg-zinc-700 text-zinc-300",
      text: "text-zinc-400",
      dot: "bg-zinc-500",
    };
  if (eff >= 90)
    return {
      bg: "bg-gradient-to-br from-emerald-950/80 to-emerald-900/60",
      border: "border-emerald-700/40",
      badge: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
    };
  if (eff >= 70)
    return {
      bg: "bg-gradient-to-br from-amber-950/80 to-yellow-900/60",
      border: "border-amber-700/40",
      badge: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
      text: "text-amber-400",
      dot: "bg-amber-400",
    };
  return {
    bg: "bg-gradient-to-br from-red-950/80 to-red-900/60",
    border: "border-red-700/40",
    badge: "bg-red-500/20 text-red-300 border border-red-500/30",
    text: "text-red-400",
    dot: "bg-red-400",
  };
}

function fmtMinutes(min: number): string {
  if (min === 0) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}dk`;
  return `${h}s ${m}dk`;
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function EfficiencyRow({ log }: { log: MachineLogSummary }) {
  const colors = getEfficiencyColors(log.efficiency_percent);
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/90 truncate">{fmtDate(log.date)}</p>
        <p className="text-xs text-white/50 truncate mt-0.5">{log.product_name}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-white/40">
          {log.working_minutes ? fmtMinutes(log.working_minutes) : "—"}
        </p>
        <p className={`text-sm font-bold ${colors.text}`}>
          {log.efficiency_percent !== null ? `${log.efficiency_percent}%` : "—"}
        </p>
      </div>
    </div>
  );
}

export default function MachineStatsCard({ machine, isAdmin }: Props) {
  const [open, setOpen] = useState(false);
  const colors = getEfficiencyColors(machine.avg_efficiency);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setOpen(true);
          }
        }}
        tabIndex={0}
        className={`
          w-full text-left rounded-2xl border p-5 transition-all duration-200 cursor-pointer
          hover:scale-[1.02] hover:shadow-lg hover:shadow-black/30 active:scale-[0.99]
          ${colors.bg} ${colors.border}
          relative overflow-hidden group
        `}
        aria-label={`${machine.name} detaylarını gör`}
      >
        {/* Animated glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 ${colors.dot}`} />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-4 relative">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${colors.dot} shadow-[0_0_6px_currentColor]`} />
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Makine</span>
          </div>
          <ChevronRight className="w-4 h-4 text-white/25 group-hover:text-white/50 transition-colors" />
        </div>

        {/* Machine name */}
        <h3 className="text-base font-bold text-white/90 mb-4 leading-tight line-clamp-2">
          {machine.name}
        </h3>

        {/* Efficiency % */}
        <div className="mb-4">
          <span className={`text-4xl font-black ${colors.text}`}>
            {machine.avg_efficiency !== null ? `${machine.avg_efficiency}%` : "—"}
          </span>
          {machine.avg_efficiency !== null && (
            <span className="text-xs text-white/30 ml-2">verim</span>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-white/30" />
            <span className="text-xs text-white/40">
              {fmtMinutes(machine.total_working_minutes)}
            </span>
          </div>
          <div className="w-px h-3 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-white/30" />
            <span className="text-xs text-white/40">{machine.log_count} kayıt</span>
          </div>
        </div>

        {/* Admin controls — stop propagation */}
        {isAdmin && (
          <div
            className="flex items-center gap-1 mt-3 pt-3 border-t border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <EditMachineButton id={machine.id} name={machine.name} />
            <DeleteMachineButton id={machine.id} name={machine.name} />
          </div>
        )}
      </div>

      {/* Detail Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md bg-zinc-950/95 border-zinc-800 flex flex-col"
        >
          <SheetHeader className="pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${colors.dot} shadow-[0_0_8px_currentColor]`} />
              <SheetTitle className="text-white text-base leading-tight">
                {machine.name}
              </SheetTitle>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div>
                <p className="text-3xl font-black text-white">
                  {machine.avg_efficiency !== null ? `${machine.avg_efficiency}%` : "—"}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">Ortalama Verim</p>
              </div>
              <div className="ml-4 border-l border-zinc-800 pl-4">
                <p className="text-lg font-bold text-zinc-300">
                  {fmtMinutes(machine.total_working_minutes)}
                </p>
                <p className="text-xs text-zinc-500">Toplam Çalışma</p>
              </div>
              <div className="border-l border-zinc-800 pl-4">
                <p className="text-lg font-bold text-zinc-300">{machine.log_count}</p>
                <p className="text-xs text-zinc-500">Kayıt</p>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto mt-2">
            {machine.logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <TrendingUp className="w-10 h-10 text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-500">Henüz üretim verisi yok.</p>
              </div>
            ) : (
              <div className="px-1">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">
                  Üretim Geçmişi
                </p>
                {machine.logs.map((log, i) => (
                  <EfficiencyRow key={i} log={log} />
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
