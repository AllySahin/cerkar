"use client";

import { useState, useMemo } from "react";
import { type ProductFormEntry, type Product, type Machine, type Personnel } from "@/lib/types";
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
import { Combobox } from "@/components/ui/combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Loader2, Factory, Gauge, Users } from "lucide-react";
import { toast } from "sonner";

interface ProductionFormProps {
  products: Product[];
  machines: Machine[];
  personnel: Personnel[];
}

// Saat stringini dakikaya çevir ("HH:MM" → dakika)
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Verim hesaplama
function calcEfficiency(
  startTime: string,
  endTime: string,
  breakDuration: number,
  cycleTime: number | null,
  goodQuantity: number
): { availableMinutes: number; expectedOutput: number; efficiencyPercent: number } | null {
  if (!cycleTime || cycleTime <= 0) return null;

  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const availableMinutes = endMin - startMin - (breakDuration || 0);
  if (availableMinutes <= 0) return null;

  const availableSeconds = availableMinutes * 60;
  const expectedOutput = availableSeconds / cycleTime;
  if (expectedOutput <= 0) return null;

  const efficiencyPercent = (goodQuantity / expectedOutput) * 100;

  return {
    availableMinutes,
    expectedOutput,
    efficiencyPercent,
  };
}

function EfficiencyBadge({
  efficiency,
}: {
  efficiency: ReturnType<typeof calcEfficiency>;
}) {
  if (!efficiency) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Gauge className="h-3.5 w-3.5" />
        <span>Verim hesaplanamıyor (çevrim süresi yok)</span>
      </div>
    );
  }

  const pct = efficiency.efficiencyPercent;
  const color =
    pct >= 90
      ? "text-emerald-600 bg-emerald-50 border-emerald-200"
      : pct >= 70
      ? "text-amber-600 bg-amber-50 border-amber-200"
      : "text-red-600 bg-red-50 border-red-200";

  return (
    <div className="rounded-lg border p-3 space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Gauge className="h-3.5 w-3.5" />
        Makine Verimi
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Kullanılabilir Süre</p>
          <p className="font-semibold">{efficiency.availableMinutes} dk</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Beklenen Çıktı</p>
          <p className="font-semibold">{efficiency.expectedOutput.toFixed(1)} adet</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Verim</p>
          <p className={`font-bold text-base rounded-md px-2 py-0.5 inline-block border ${color}`}>
            %{pct.toFixed(1)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProductionForm({ products, machines, personnel }: ProductionFormProps) {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [entries, setEntries] = useState<ProductFormEntry[]>([
    {
      product_id: "",
      machine_id: "",
      good_quantity: 0,
      scrap_quantity: 0,
      cycle_time: null,
      start_time: "08:00",
      end_time: "18:00",
      break_duration: 0,
      personnel_ids: [],
    },
  ]);
  const [saving, setSaving] = useState(false);

  // Ürün ID'den cycle_time al
  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products]
  );

  // Combobox için ürün listesini formatla
  const productComboboxItems = useMemo(
    () =>
      products.map((p) => ({
        value: p.id,
        label: p.name,
        secondaryLabel: p.cycle_time != null ? `(${p.cycle_time} sn)` : undefined,
      })),
    [products]
  );

  // Personel ID map'i
  const personnelMap = useMemo(
    () => new Map(personnel.map((p) => [p.id, p])),
    [personnel]
  );

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      {
        product_id: "",
        machine_id: "",
        good_quantity: 0,
        scrap_quantity: 0,
        cycle_time: null,
        start_time: "08:00",
        end_time: "18:00",
        break_duration: 0,
        personnel_ids: [],
      },
    ]);
  };

  const removeEntry = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEntry = (
    index: number,
    field: keyof ProductFormEntry,
    value: string | number | null | string[]
  ) => {
    setEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    );
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = productMap.get(productId);
    setEntries((prev) =>
      prev.map((entry, i) =>
        i === index
          ? {
              ...entry,
              product_id: productId,
              // Ürünün mevcut çevrim süresini otomatik doldur
              cycle_time: product?.cycle_time ?? null,
            }
          : entry
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
      setEntries([
        {
          product_id: "",
          machine_id: "",
          good_quantity: 0,
          scrap_quantity: 0,
          cycle_time: null,
          start_time: "08:00",
          end_time: "18:00",
          break_duration: 0,
          personnel_ids: [],
        },
      ]);
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
      {entries.map((entry, entryIndex) => {
        const efficiency = calcEfficiency(
          entry.start_time,
          entry.end_time,
          entry.break_duration,
          entry.cycle_time,
          entry.good_quantity
        );

        return (
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
              {/* Ürün, Makine ve Operatör Seçimi */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Ürün</Label>
                  <Combobox
                    value={entry.product_id}
                    onValueChange={(val) => handleProductChange(entryIndex, val)}
                    items={productComboboxItems}
                    placeholder="Ürün seçin..."
                    searchPlaceholder="Ürün adı ara..."
                    emptyText="Ürün bulunamadı."
                  />
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

                <div className="space-y-2">
                  <Label>Operatörler (Çoklu Seçim)</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="inline-flex items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground w-full text-left"
                    >
                      <div className="flex items-center gap-2 overflow-hidden truncate">
                        <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {entry.personnel_ids.length === 0 ? (
                          <span className="text-muted-foreground">Operatör seçin...</span>
                        ) : (
                          <span className="truncate">
                            {entry.personnel_ids
                              .map((pid) => personnelMap.get(pid)?.name)
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground text-xs ml-2 shrink-0">
                        ({entry.personnel_ids.length})
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-72 max-h-60 overflow-y-auto">
                      {personnel.map((p) => {
                        const isChecked = entry.personnel_ids.includes(p.id);
                        return (
                          <DropdownMenuCheckboxItem
                            key={p.id}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const newIds = checked
                                ? [...entry.personnel_ids, p.id]
                                : entry.personnel_ids.filter((id) => id !== p.id);
                              updateEntry(entryIndex, "personnel_ids", newIds);
                            }}
                          >
                            {p.name}
                          </DropdownMenuCheckboxItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  {entry.personnel_ids.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {entry.personnel_ids.map((pid) => {
                        const pName = personnelMap.get(pid)?.name || "";
                        return (
                          <Badge key={pid} variant="secondary" className="text-[10px] py-0 px-1.5 font-normal">
                            {pName}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Çevrim Süresi ve Zaman Girişleri */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <Label>Çevrim Süresi (sn/parça)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={entry.cycle_time ?? ""}
                    onChange={(e) =>
                      updateEntry(
                        entryIndex,
                        "cycle_time",
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    placeholder="Örn: 45"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Başlangıç Saati</Label>
                  <Input
                    type="time"
                    value={entry.start_time}
                    onChange={(e) => updateEntry(entryIndex, "start_time", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bitiş Saati</Label>
                  <Input
                    type="time"
                    value={entry.end_time}
                    onChange={(e) => updateEntry(entryIndex, "end_time", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mola (dk)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={entry.break_duration || ""}
                    onChange={(e) =>
                      updateEntry(entryIndex, "break_duration", Number(e.target.value) || 0)
                    }
                    placeholder="0"
                  />
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
                      updateEntry(entryIndex, "good_quantity", Math.max(0, Number(e.target.value) || 0))
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
                      updateEntry(entryIndex, "scrap_quantity", Math.max(0, Number(e.target.value) || 0))
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

              {/* Verim Göstergesi */}
              <EfficiencyBadge efficiency={efficiency} />
            </CardContent>
          </Card>
        );
      })}

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
