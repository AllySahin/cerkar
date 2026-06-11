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

  const todayStr = formatDate(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDate(yesterday);

  const getThisWeekStart = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMonday);
    return formatDate(monday);
  };

  const get30DaysAgoStart = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);
    return formatDate(thirtyDaysAgo);
  };

  const isTodayActive = start === todayStr && end === todayStr;
  const isYesterdayActive = start === yesterdayStr && end === yesterdayStr;
  const isThisWeekActive = start === getThisWeekStart() && end === todayStr;
  const isLast30Active = start === get30DaysAgoStart() && end === todayStr;
  const isAllActive = !start && !end;

  const getPresetClass = (isActive: boolean) => {
    return `px-3 py-1 text-xs rounded-full border transition-all ${
      isActive
        ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 font-semibold shadow-xs"
        : "bg-zinc-50 dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900/60"
    }`;
  };

  return (
    <div className="bg-card text-card-foreground border border-border rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center gap-2 text-foreground">
        <CalendarRange className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
        <h2 className="text-sm font-semibold tracking-wide">Tarih Aralığı Filtresi</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:items-end gap-4">
        <div className="space-y-1.5 flex-1 min-w-[140px]">
          <Label htmlFor="start-date" className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Başlangıç Tarihi</Label>
          <Input
            id="start-date"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="focus-visible:ring-primary/30"
          />
        </div>

        <div className="space-y-1.5 flex-1 min-w-[140px]">
          <Label htmlFor="end-date" className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Bitiş Tarihi</Label>
          <Input
            id="end-date"
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="focus-visible:ring-primary/30"
          />
        </div>

        <div className="flex items-center gap-2 md:self-end shrink-0 w-full md:w-auto">
          <Button
            onClick={() => handleFilter()}
            className="font-bold flex-1 md:flex-initial shadow-xs"
          >
            Filtrele
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
            size="icon"
            title="Filtreyi Temizle"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Preset Badges */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium mr-1">Hızlı Seçim:</span>
        <button
          onClick={() => setPreset("today")}
          className={getPresetClass(isTodayActive)}
        >
          Bugün
        </button>
        <button
          onClick={() => setPreset("yesterday")}
          className={getPresetClass(isYesterdayActive)}
        >
          Dün
        </button>
        <button
          onClick={() => setPreset("thisWeek")}
          className={getPresetClass(isThisWeekActive)}
        >
          Bu Hafta
        </button>
        <button
          onClick={() => setPreset("last30")}
          className={getPresetClass(isLast30Active)}
        >
          Son 30 Gün
        </button>
        <button
          onClick={() => setPreset("all")}
          className={getPresetClass(isAllActive)}
        >
          Tüm Zamanlar
        </button>
      </div>
    </div>
  );
}
