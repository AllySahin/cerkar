"use client";

import { useState } from "react";
import { type ProductFormEntry, type Product, type Machine } from "@/lib/types";
import { saveProductionLogs } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, Loader2, Factory } from "lucide-react";
import { toast } from "sonner";

interface ProductionFormProps {
  products: Product[];
  machines: Machine[];
}

export default function ProductionForm({ products, machines }: ProductionFormProps) {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [entries, setEntries] = useState<ProductFormEntry[]>([
    { product_id: "", machine_id: "", good_quantity: 0, scrap_quantity: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { product_id: "", machine_id: "", good_quantity: 0, scrap_quantity: 0 },
    ]);
  };

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof ProductFormEntry, value: string | number) => {
    setEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    );
  };

  const handleSubmit = async () => {
    const invalidEntries = entries.filter((e) => !e.product_id);
    if (invalidEntries.length > 0) {
      toast.error("Lütfen tüm kayıtlar için ürün seçin.");
      return;
    }

    const noDataEntries = entries.filter(
      (e) => e.good_quantity === 0 && e.scrap_quantity === 0
    );
    if (noDataEntries.length === entries.length) {
      toast.error("En az bir kayıt için miktar girin.");
      return;
    }

    setSaving(true);
    try {
      const result = await saveProductionLogs(entries, date);
      toast.success(`${result.count} kayıt başarıyla kaydedildi!`);
      setEntries([{ product_id: "", machine_id: "", good_quantity: 0, scrap_quantity: 0 }]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Kayıt sırasında hata oluştu."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tarih Seçimi */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Factory className="h-5 w-5 text-primary" />
            Üretim Veri Girişi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Üretim Tarihi</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-48"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Kayıt Sayısı: {entries.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kayıt Girişleri */}
      {entries.map((entry, entryIndex) => (
        <Card key={entryIndex} className="border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Kayıt #{entryIndex + 1}
              </CardTitle>
              {entries.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEntry(entryIndex)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Kaldır
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ürün ve Makine Seçimi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ürün</Label>
                <Select
                  value={entry.product_id}
                  onValueChange={(val) => updateEntry(entryIndex, "product_id", val ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Ürün seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Makine (Opsiyonel)</Label>
                <Select
                  value={entry.machine_id}
                  onValueChange={(val) => updateEntry(entryIndex, "machine_id", val ?? "")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Makine seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map((machine) => (
                      <SelectItem key={machine.id} value={machine.id}>
                        {machine.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Miktar Girişleri */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Sağlam Adet</Label>
                <Input
                  type="number"
                  min={0}
                  value={entry.good_quantity || ""}
                  onChange={(e) =>
                    updateEntry(entryIndex, "good_quantity", Math.max(0, parseInt(e.target.value || "0")))
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Hurda Adet</Label>
                <Input
                  type="number"
                  min={0}
                  value={entry.scrap_quantity || ""}
                  onChange={(e) =>
                    updateEntry(entryIndex, "scrap_quantity", Math.max(0, parseInt(e.target.value || "0")))
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Toplam</Label>
                <div className="flex items-center h-9 px-3 rounded-md border bg-muted text-sm font-semibold">
                  {entry.good_quantity + entry.scrap_quantity}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Aksiyon Butonları */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={addEntry} className="gap-2">
          <Plus className="h-4 w-4" />
          Yeni Kayıt Ekle
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="gap-2 min-w-[160px]"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Kaydet
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
