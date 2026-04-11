"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { History, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { updateProductionLog, deleteProductionLog } from "@/lib/actions";
import { toast } from "sonner";

interface LogEntry {
  id: string;
  product_id: string;
  machine_id: string | null;
  date: string;
  good_quantity: number;
  scrap_quantity: number;
  total_quantity: number;
  created_at: string;
  products: { id: string; name: string };
  machines: { id: string; name: string } | null;
}

interface HistoryListProps {
  initialLogs: LogEntry[];
  isAdmin?: boolean;
}

export default function HistoryList({ initialLogs, isAdmin }: HistoryListProps) {
  const [search, setSearch] = useState("");
  const [editLog, setEditLog] = useState<LogEntry | null>(null);
  const [editGood, setEditGood] = useState(0);
  const [editScrap, setEditScrap] = useState(0);
  const [editDate, setEditDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return initialLogs;
    const q = search.toLowerCase();
    return initialLogs.filter(
      (log) =>
        log.products?.name?.toLowerCase().includes(q) ||
        log.machines?.name?.toLowerCase().includes(q) ||
        log.date.includes(q)
    );
  }, [initialLogs, search]);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, LogEntry[]>();
    for (const log of filtered) {
      const existing = map.get(log.date);
      if (existing) {
        existing.push(log);
      } else {
        map.set(log.date, [log]);
      }
    }
    return Array.from(map.entries());
  }, [filtered]);

  const openEdit = (log: LogEntry) => {
    setEditLog(log);
    setEditGood(log.good_quantity);
    setEditScrap(log.scrap_quantity);
    setEditDate(log.date);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLog) return;
    setSaving(true);
    try {
      await updateProductionLog(editLog.id, {
        good_quantity: editGood,
        scrap_quantity: editScrap,
        date: editDate,
      });
      toast.success("Kayıt güncellendi.");
      setEditLog(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Güncelleme başarısız."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (log: LogEntry) => {
    const label = `${log.products?.name ?? "Ürün"} - ${log.date}`;
    if (!confirm(`"${label}" kaydını silmek istediğinize emin misiniz?`)) return;
    setDeletingId(log.id);
    try {
      await deleteProductionLog(log.id);
      toast.success("Kayıt silindi.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Silme başarısız."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Arama */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Ürün, makine veya tarih ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <History className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">
              {search ? "Aramayla eşleşen kayıt bulunamadı." : "Henüz üretim kaydı yok."}
            </p>
          </CardContent>
        </Card>
      ) : (
        grouped.map(([date, logs]) => {
          const dayTotal = logs.reduce((s, l) => s + l.total_quantity, 0);
          const dayGood = logs.reduce((s, l) => s + l.good_quantity, 0);
          const dayScrap = logs.reduce((s, l) => s + l.scrap_quantity, 0);

          return (
            <Card key={date}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {new Date(date).toLocaleDateString("tr-TR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Badge>
                    <span className="text-sm text-muted-foreground font-normal">
                      {logs.length} kayıt
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-emerald-600 font-semibold">{dayGood} sağlam</span>
                    <span className="text-red-600 font-semibold">{dayScrap} hurda</span>
                    <span className="font-bold">{dayTotal} toplam</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ürün</TableHead>
                      <TableHead>Makine</TableHead>
                      <TableHead className="text-center">Sağlam</TableHead>
                      <TableHead className="text-center">Hurda</TableHead>
                      <TableHead className="text-center">Toplam</TableHead>
                      {isAdmin && <TableHead className="text-center w-24">İşlem</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.products?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.machines?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-center text-emerald-600 font-semibold">
                          {log.good_quantity}
                        </TableCell>
                        <TableCell className="text-center text-red-600 font-semibold">
                          {log.scrap_quantity}
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {log.total_quantity}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEdit(log)}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(log)}
                                disabled={deletingId === log.id}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                {deletingId === log.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })
      )}

      <p className="text-xs text-muted-foreground text-center">
        Toplam {filtered.length} kayıt gösteriliyor
      </p>

      {/* Düzenleme Dialog */}
      <Dialog open={!!editLog} onOpenChange={(open) => !open && setEditLog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kaydı Düzenle</DialogTitle>
          </DialogHeader>
          {editLog && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{editLog.products?.name}</span>
                {editLog.machines?.name && (
                  <span> — {editLog.machines.name}</span>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Tarih</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-good">Sağlam Adet</Label>
                  <Input
                    id="edit-good"
                    type="number"
                    min={0}
                    value={editGood}
                    onChange={(e) => setEditGood(Number(e.target.value))}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-scrap">Hurda Adet</Label>
                  <Input
                    id="edit-scrap"
                    type="number"
                    min={0}
                    value={editScrap}
                    onChange={(e) => setEditScrap(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setEditLog(null)}>
                  İptal
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Güncelle
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
