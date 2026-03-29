import { getProducts, getCurrentProfile } from "@/lib/actions";
import type { Product } from "@/lib/types";
import AddProductDialog from "@/components/add-product-dialog";
import DeleteProductButton from "@/components/delete-product-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

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
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">
              Henüz ürün eklenmemiş. Yukarıdaki butonu kullanarak yeni ürün ekleyin.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Kayıtlı Ürünler ({products.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Eklenme: {new Date(product.created_at).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  {isAdmin && <DeleteProductButton id={product.id} name={product.name} />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
