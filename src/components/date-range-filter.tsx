"use client";

import { useState, startTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CalendarRange, RotateCcw } from "lucide-react";

export default function DateRangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get initial dates from URL
  const [start, setStart] = useState(searchParams.get("start") || "");
  const [end, setEnd] = useState(searchParams.get("end") || "");

  const handleFilter = (customStart?: string, customEnd?: string) => {
    const activeStart = customStart !== undefined ? customStart : start;
    const activeEnd = customEnd !== undefined ? customEnd : end;

    const params = new URLSearchParams(searchParams.toString());
    if (activeStart) {
      params.set("start", activeStart);
    } else {
      params.delete("start");
    }

    if (activeEnd) {
      params.set("end", activeEnd);
    } else {
      params.delete("end");
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleReset = () => {
    setStart("");
    setEnd("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const setPreset = (type: "today" | "yesterday" | "thisWeek" | "last30" | "all") => {
    const today = new Date();
    let s = "";
    let e = formatDate(today);

    switch (type) {
      case "today":
        s = formatDate(today);
        break;
      case "yesterday": {
        const yesterday = new Date(today.getTime() - 86400000);
        s = formatDate(yesterday);
        e = formatDate(yesterday);
        break;
      }
      case "thisWeek": {
        const dayOfWeek = today.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(today);
        monday.setDate(today.getDate() - diffToMonday);
        s = formatDate(monday);
        break;
      }
      case "last30": {
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);
        s = formatDate(thirtyDaysAgo);
        break;
      }
      case "all":
      default:
        s = "";
        e = "";
        break;
    }

    setStart(s);
    setEnd(e);
    handleFilter(s, e);
  };

  return (
    <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-md space-y-4">
      <div className="flex items-center gap-2 text-white/95">
        <CalendarRange className="w-5 h-5 text-emerald-400" />
        <h2 className="text-sm font-semibold tracking-wide">Tarih Aralığı Filtresi</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:items-end gap-4">
        <div className="space-y-1.5 flex-1 min-w-[140px]">
          <Label htmlFor="start-date" className="text-xs text-zinc-400 font-medium">Başlangıç Tarihi</Label>
          <Input
            id="start-date"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="bg-zinc-950/50 border-zinc-800 text-white placeholder-zinc-500 focus-visible:ring-emerald-500/30"
          />
        </div>

        <div className="space-y-1.5 flex-1 min-w-[140px]">
          <Label htmlFor="end-date" className="text-xs text-zinc-400 font-medium">Bitiş Tarihi</Label>
          <Input
            id="end-date"
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="bg-zinc-950/50 border-zinc-800 text-white placeholder-zinc-500 focus-visible:ring-emerald-500/30"
          />
        </div>

        <div className="flex items-center gap-2 md:self-end shrink-0 w-full md:w-auto">
          <Button
            onClick={() => handleFilter()}
            className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold flex-1 md:flex-initial shadow-md shadow-emerald-500/10"
          >
            Filtrele
          </Button>
          <Button
            variant="ghost"
            onClick={handleReset}
            className="border border-zinc-800 hover:bg-zinc-800/60 text-zinc-400 hover:text-white"
            size="icon"
            title="Filtreyi Temizle"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preset Badges */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/40">
        <span className="text-xs text-zinc-500 font-medium mr-1">Hızlı Seçim:</span>
        <button
          onClick={() => setPreset("today")}
          className={`px-3 py-1 text-xs rounded-full border transition-all ${
            start === formatDate(new Date()) && end === formatDate(new Date())
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-zinc-950/30 text-zinc-400 border-zinc-800 hover:border-zinc-700"
          }`}
        >
          Bugün
        </button>
        <button
          onClick={() => setPreset("yesterday")}
          className="px-3 py-1 text-xs rounded-full border bg-zinc-950/30 text-zinc-400 border-zinc-800 hover:border-zinc-700 transition-all"
        >
          Dün
        </button>
        <button
          onClick={() => setPreset("thisWeek")}
          className="px-3 py-1 text-xs rounded-full border bg-zinc-950/30 text-zinc-400 border-zinc-800 hover:border-zinc-700 transition-all"
        >
          Bu Hafta
        </button>
        <button
          onClick={() => setPreset("last30")}
          className={`px-3 py-1 text-xs rounded-full border transition-all ${
            start && !end ? "bg-zinc-950/30 text-zinc-400 border-zinc-800" : ""
          }`}
        >
          Son 30 Gün
        </button>
        <button
          onClick={() => setPreset("all")}
          className={`px-3 py-1 text-xs rounded-full border transition-all ${
            !start && !end
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-zinc-950/30 text-zinc-400 border-zinc-800 hover:border-zinc-700"
          }`}
        >
          Tüm Zamanlar
        </button>
      </div>
    </div>
  );
}
