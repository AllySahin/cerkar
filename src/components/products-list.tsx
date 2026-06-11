"use client";

import { useState, useMemo } from "react";
import type { Product } from "@/lib/types";
import EditProductButton from "@/components/edit-product-button";
import DeleteProductButton from "@/components/delete-product-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Package, Search } from "lucide-react";

interface ProductsListProps {
  initialProducts: Product[];
  isAdmin: boolean;
}

export default function ProductsList({ initialProducts, isAdmin }: ProductsListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Normalize Turkish characters for search
  const normalizeText = (text: string): string => {
    return text
      .toLocaleLowerCase("tr-TR")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ı/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c");
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return initialProducts;
    const query = normalizeText(searchQuery);
    return initialProducts.filter((product) =>
      normalizeText(product.name).includes(query)
    );
  }, [initialProducts, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Smart Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Ürün adı ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 shadow-xs"
        />
      </div>

      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">
              {searchQuery ? "Aramayla eşleşen ürün bulunamadı." : "Henüz ürün eklenmemiş."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Kayıtlı Ürünler ({filteredProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between py-3 hover:bg-muted/30 px-2 rounded-md transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground">{product.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {product.cycle_time != null ? (
                        <p className="text-xs text-muted-foreground">
                          ⏱ Çevrim: <span className="font-medium text-foreground">{product.cycle_time} sn/parça</span>
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Çevrim süresi girilmemiş</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Eklenme: {new Date(product.created_at).toLocaleDateString("tr-TR")}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <EditProductButton id={product.id} name={product.name} cycleTime={product.cycle_time} />
                      <DeleteProductButton id={product.id} name={product.name} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
