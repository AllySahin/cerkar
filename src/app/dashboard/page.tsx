import DashboardView from "@/components/dashboard-view";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Günlük üretim verilerinizi görüntüleyin ve geçmişle kıyaslayın.
        </p>
      </div>

      <DashboardView />
    </div>
  );
}
