"use client";

import { useState } from "react";
import type { PersonnelStat, PersonnelLogSummary } from "@/lib/actions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { UserRound, TrendingUp, ChevronRight, Cog } from "lucide-react";
import EditPersonnelButton from "@/components/edit-personnel-button";
import DeletePersonnelButton from "@/components/delete-personnel-button";

interface Props {
  person: PersonnelStat;
  isAdmin: boolean;
}

function getEfficiencyColors(eff: number | null) {
  if (eff === null)
    return {
      bg: "bg-gradient-to-br from-zinc-800/60 to-zinc-900/80",
      border: "border-zinc-700/50",
      text: "text-zinc-400",
      dot: "bg-zinc-500",
    };
  if (eff >= 90)
    return {
      bg: "bg-gradient-to-br from-emerald-950/80 to-emerald-900/60",
      border: "border-emerald-700/40",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
    };
  if (eff >= 70)
    return {
      bg: "bg-gradient-to-br from-amber-950/80 to-yellow-900/60",
      border: "border-amber-700/40",
      text: "text-amber-400",
      dot: "bg-amber-400",
    };
  return {
    bg: "bg-gradient-to-br from-red-950/80 to-red-900/60",
    border: "border-red-700/40",
    text: "text-red-400",
    dot: "bg-red-400",
  };
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function LogRow({ log }: { log: PersonnelLogSummary }) {
  const colors = getEfficiencyColors(log.efficiency_percent);
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white/90 truncate">{fmtDate(log.date)}</p>
        <p className="text-xs text-white/50 truncate mt-0.5">
          {log.product_name}
          {log.machine_name !== "—" && (
            <span className="text-white/30"> · {log.machine_name}</span>
          )}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-white/40">{log.good_quantity} adet</p>
        <p className={`text-sm font-bold ${colors.text}`}>
          {log.efficiency_percent !== null ? `${log.efficiency_percent}%` : "—"}
        </p>
      </div>
    </div>
  );
}

export default function PersonnelStatsCard({ person, isAdmin }: Props) {
  const [open, setOpen] = useState(false);
  const colors = getEfficiencyColors(person.avg_efficiency);

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
        aria-label={`${person.name} detaylarını gör`}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className={`absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl opacity-20 ${colors.dot}`} />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-3 relative">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white/80 border ${colors.border}`}
              style={{ background: "rgba(255,255,255,0.07)" }}
            >
              {getInitials(person.name)}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-white/25 group-hover:text-white/50 transition-colors" />
        </div>

        {/* Name */}
        <h3 className="text-sm font-bold text-white/90 mb-3 leading-tight line-clamp-2">
          {person.name}
        </h3>

        {/* Efficiency */}
        <div className="mb-3">
          <span className={`text-3xl font-black ${colors.text}`}>
            {person.avg_efficiency !== null ? `${person.avg_efficiency}%` : "—"}
          </span>
          {person.avg_efficiency !== null && (
            <span className="text-xs text-white/30 ml-2">verim</span>
          )}
        </div>

        {/* Kayıt sayısı */}
        <p className="text-xs text-white/35">
          {person.log_count > 0 ? `${person.log_count} üretim kaydı` : "Kayıt yok"}
        </p>

        {/* Admin controls */}
        {isAdmin && (
          <div
            className="flex items-center gap-1 mt-3 pt-3 border-t border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <EditPersonnelButton id={person.id} name={person.name} />
            <DeletePersonnelButton id={person.id} name={person.name} />
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
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white border ${colors.border}`}
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                {getInitials(person.name)}
              </div>
              <SheetTitle className="text-white text-base leading-tight">
                {person.name}
              </SheetTitle>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <div>
                <p className={`text-3xl font-black ${colors.text}`}>
                  {person.avg_efficiency !== null ? `${person.avg_efficiency}%` : "—"}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">Ortalama Verim</p>
              </div>
              <div className="border-l border-zinc-800 pl-4 ml-2">
                <p className="text-lg font-bold text-zinc-300">{person.log_count}</p>
                <p className="text-xs text-zinc-500">Üretim Kaydı</p>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto mt-2">
            {person.logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <TrendingUp className="w-10 h-10 text-zinc-700 mb-3" />
                <p className="text-sm text-zinc-500">Henüz üretim kaydı yok.</p>
              </div>
            ) : (
              <div className="px-1">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">
                  Üretim Geçmişi
                </p>
                {person.logs.map((log, i) => (
                  <LogRow key={i} log={log} />
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
