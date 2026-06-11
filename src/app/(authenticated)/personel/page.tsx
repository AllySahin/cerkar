import { getPersonnelStats, getCurrentProfile } from "@/lib/actions";
import AddPersonnelDialog from "@/components/add-personnel-dialog";
import PersonnelStatsCard from "@/components/personnel-stats-card";
import DateRangeFilter from "@/components/date-range-filter";
import { Users, UserRound } from "lucide-react";

export default async function PersonelPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { start, end } = await searchParams;
  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === "admin";

  const personnelList = await getPersonnelStats(start, end);

  // Ortalama personel verimi
  const withData = personnelList.filter((p) => p.avg_efficiency !== null);
  const avgEfficiency =
    withData.length > 0
      ? Math.round(
          withData.reduce((acc, p) => acc + p.avg_efficiency!, 0) / withData.length
        )
      : null;

  function headerColor(eff: number | null) {
    if (eff === null) {
      return {
        text: "text-zinc-600 dark:text-zinc-400",
        ring: "ring-zinc-200 dark:ring-zinc-800",
        bg: "bg-zinc-50/80 dark:bg-zinc-900/40",
        iconBg: "bg-zinc-100 dark:bg-zinc-800",
        iconText: "text-zinc-600 dark:text-zinc-400"
      };
    }
    if (eff >= 90) {
      return {
        text: "text-emerald-700 dark:text-emerald-400",
        ring: "ring-emerald-200/60 dark:ring-emerald-800/30",
        bg: "bg-emerald-50/80 dark:bg-emerald-950/40",
        iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
        iconText: "text-emerald-700 dark:text-emerald-400"
      };
    }
    if (eff >= 70) {
      return {
        text: "text-amber-700 dark:text-amber-400",
        ring: "ring-amber-200/60 dark:ring-amber-800/30",
        bg: "bg-amber-50/80 dark:bg-amber-950/40",
        iconBg: "bg-amber-100 dark:bg-amber-900/50",
        iconText: "text-amber-700 dark:text-amber-400"
      };
    }
    return {
      text: "text-red-700 dark:text-red-400",
      ring: "ring-red-200/60 dark:ring-red-800/30",
      bg: "bg-red-50/80 dark:bg-red-950/40",
      iconBg: "bg-red-100 dark:bg-red-900/50",
      iconText: "text-red-700 dark:text-red-400"
    };
  }

  const hc = headerColor(avgEfficiency);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Personel Yönetimi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Operatör verimleri ve üretim geçmişi
          </p>
        </div>
        {isAdmin && <AddPersonnelDialog />}
      </div>

      {/* Date Filter */}
      <DateRangeFilter />

      {/* Ortalama Personel Verimi Banner */}
      <div
        className={`
          rounded-2xl ring-1 p-6 flex items-center gap-6
          ${hc.bg} ${hc.ring}
          relative overflow-hidden
        `}
      >
        <div className={`absolute -right-8 -top-8 w-40 h-40 rounded-full blur-3xl opacity-20 ${hc.text.replace("text-", "bg-")}`} />

        <div className={`p-3 rounded-xl ring-1 ${hc.ring} ${hc.iconBg}`}>
          <Users className={`w-7 h-7 ${hc.iconText}`} />
        </div>

        <div className="flex-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Ortalama Personel Verimi
          </p>
          <p className={`text-4xl font-black ${hc.text}`}>
            {avgEfficiency !== null ? `${avgEfficiency}%` : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {withData.length} / {personnelList.length} personelden hesaplandı
          </p>
        </div>

        {avgEfficiency !== null && (
          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
            <div className="w-48 h-3 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  avgEfficiency >= 90
                    ? "bg-emerald-500 dark:bg-emerald-400"
                    : avgEfficiency >= 70
                    ? "bg-amber-500 dark:bg-amber-400"
                    : "bg-red-500 dark:bg-red-400"
                }`}
                style={{ width: `${Math.min(avgEfficiency, 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {avgEfficiency >= 90 ? "Mükemmel" : avgEfficiency >= 70 ? "Orta" : "Düşük"}
            </span>
          </div>
        )}
      </div>

      {/* Personnel Grid */}
      {personnelList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 flex flex-col items-center justify-center py-16 text-center">
          <UserRound className="w-12 h-12 text-zinc-400 dark:text-zinc-600 mb-4" />
          <p className="text-zinc-700 dark:text-zinc-300 font-medium">Henüz personel eklenmemiş.</p>
          <p className="text-zinc-500 dark:text-zinc-500 text-sm mt-1">
            Yukarıdaki butonu kullanarak yeni personel ekleyin.
          </p>
        </div>
      ) : (
        <>
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              ≥90% Mükemmel
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              70–89% Orta
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              &lt;70% Düşük
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" />
              Veri yok
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {personnelList.map((person) => (
              <PersonnelStatsCard
                key={person.id}
                person={person}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
