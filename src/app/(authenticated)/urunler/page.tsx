import { getProducts, getCurrentProfile } from "@/lib/actions";
import type { Product } from "@/lib/types";
import AddProductDialog from "@/components/add-product-dialog";
import ProductsList from "@/components/products-list";

export default async function UrunlerPage() {
  let products: Product[] = [];
  let error: string | null = null;
  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === "admin";

  try {
    products = await getProducts();
  } catch (e) {
    error = e instanceof Error ? e.message : "Ürünler yüklenirken hata oluştu.";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ürünler</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Üretim takibi yapılan ürünleri görüntüleyin.
          </p>
        </div>
        {isAdmin && <AddProductDialog />}
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      ) : (
        <ProductsList initialProducts={products} isAdmin={isAdmin} />
      )}
    </div>
  );
}
