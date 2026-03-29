import { getProducts, getMachines } from "@/lib/actions";
import ProductionForm from "@/components/production-form";
import type { Product, Machine } from "@/lib/types";

export default async function UretimPage() {
  let products: Product[] = [];
  let machines: Machine[] = [];
  let error: string | null = null;

  try {
    [products, machines] = await Promise.all([getProducts(), getMachines()]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Veri yüklenirken hata oluştu.";
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Üretim Girişi</h1>
        </div>
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
          <p className="text-destructive font-medium">{error}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Supabase bağlantınızı ve tablolarınızı kontrol edin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Üretim Girişi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Günlük üretim verilerini süreç bazlı kaydedin.
        </p>
      </div>
      <ProductionForm products={products} machines={machines} />
    </div>
  );
}
