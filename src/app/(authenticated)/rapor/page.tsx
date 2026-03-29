import ReportView from "@/components/report-view";

export default function RaporPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rapor</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tarih aralığı seçerek üretim verilerini Excel formatında indirin.
        </p>
      </div>
      <ReportView />
    </div>
  );
}
