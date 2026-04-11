import { getHistoricalLogs, getCurrentProfile } from "@/lib/actions";
import HistoryList from "@/components/history-list";

export default async function GecmisPage() {
  let logs: Awaited<ReturnType<typeof getHistoricalLogs>> = [];
  let error: string | null = null;
  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === "admin";

  try {
    logs = await getHistoricalLogs(200);
  } catch (e) {
    error = e instanceof Error ? e.message : "Veriler yüklenirken hata oluştu.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Geçmiş Kayıtlar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tüm üretim kayıtlarını tarih sırasına göre görüntüleyin.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      ) : (
        <HistoryList initialLogs={logs} isAdmin={isAdmin} />
      )}
    </div>
  );
}
