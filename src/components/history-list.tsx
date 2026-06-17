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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { History, Search, Pencil, Trash2, Loader2, Users } from "lucide-react";
import { updateProductionLog, deleteProductionLog } from "@/lib/actions";
import { type Personnel, type ScrapReason, type Machine } from "@/lib/types";
import { toast } from "sonner";

interface LogEntry {
  id: string;
  product_id: string;
  machine_id: string | null;
  date: string;
  good_quantity: number;
  scrap_quantity: number;
  scrap_reason_id?: string | null;
  scrap_reasons?: ScrapReason | null;
  total_quantity: number;
  created_at: string;
  products: { id: string; name: string };
  machines: { id: string; name: string } | null;
  production_log_operators?: {
    personnel: { id: string; name: string };
  }[];
}

interface HistoryListProps {
  initialLogs: LogEntry[];
  isAdmin?: boolean;
  personnel?: Personnel[];
  scrapReasons?: ScrapReason[];
  machines?: Machine[];
}

export default function HistoryList({ initialLogs, isAdmin, personnel = [], scrapReasons = [], machines = [] }: HistoryListProps) {
  const [search, setSearch] = useState("");
  const [editLog, setEditLog] = useState<LogEntry | null>(null);
  const [editGood, setEditGood] = useState(0);
  const [editScrap, setEditScrap] = useState(0);
  const [editScrapReasonId, setEditScrapReasonId] = useState<string>("");
  const [editDate, setEditDate] = useState("");
  const [editPersonnelIds, setEditPersonnelIds] = useState<string[]>([]);
  const [editMachineId, setEditMachineId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const personnelMap = useMemo(
    () => new Map(personnel.map((p) => [p.id, p])),
    [personnel]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return initialLogs;
    const q = search.toLowerCase();
    return initialLogs.filter((log) => {
      const opsStr = log.production_log_operators
        ?.map((op) => op.personnel?.name)
        .filter(Boolean)
        .join(" ")
        .toLowerCase() || "";
      return (
        log.products?.name?.toLowerCase().includes(q) ||
        log.machines?.name?.toLowerCase().includes(q) ||
        log.date.includes(q) ||
        opsStr.includes(q)
      );
    });
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
    setEditScrapReasonId(log.scrap_reason_id || "");
    setEditDate(log.date);
    setEditMachineId(log.machine_id || "");
    setEditPersonnelIds(
      log.production_log_operators
        ?.map((op) => op.personnel?.id)
        .filter(Boolean) || []
    );
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLog) return;

    if (editScrap > 0 && !editScrapReasonId) {
      toast.error("Hurda adedi girilen ürünlerde hurda sebebi seçilmelidir.");
      return;
    }

    setSaving(true);
    try {
      await updateProductionLog(editLog.id, {
        good_quantity: editGood,
        scrap_quantity: editScrap,
        scrap_reason_id: editScrap > 0 ? editScrapReasonId : null,
        date: editDate,
        personnel_ids: editPersonnelIds,
        machine_id: editMachineId || null,
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
          placeholder="Ürün, makine, operatör veya tarih ara..."
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
                      <TableHead>Operatörler</TableHead>
                      <TableHead className="text-center">Sağlam</TableHead>
                      <TableHead className="text-center">Hurda</TableHead>
                      <TableHead className="text-center">Toplam</TableHead>
                      {isAdmin && <TableHead className="text-center w-24">İşlem</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const operatorsStr = log.production_log_operators
                        ?.map((op) => op.personnel?.name)
                        .filter(Boolean)
                        .join(", ") || "—";
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium">
                            {log.products?.name ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {log.machines?.name ?? "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[150px] truncate" title={operatorsStr}>
                            {operatorsStr}
                          </TableCell>
                          <TableCell className="text-center text-emerald-600 font-semibold">
                            {log.good_quantity}
                          </TableCell>
                          <TableCell className="text-center text-red-600 font-semibold">
                            <div>{log.scrap_quantity}</div>
                            {log.scrap_reasons && (
                              <span className="text-[10px] text-muted-foreground block font-normal mt-0.5">
                                ({log.scrap_reasons.reason})
                              </span>
                            )}
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
                      );
                    })}
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
                Ürün: <span className="font-medium text-foreground">{editLog.products?.name}</span>
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

              <div className="space-y-2">
                <Label htmlFor="edit-machine">Makine (Opsiyonel)</Label>
                <Select
                  value={editMachineId}
                  onValueChange={(val) => setEditMachineId(val ?? "")}
                  items={machines.map((machine) => ({ value: machine.id, label: machine.name }))}
                >
                  <SelectTrigger id="edit-machine" className="w-full">
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
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEditScrap(val);
                      if (val === 0) setEditScrapReasonId("");
                    }}
                  />
                </div>
              </div>
 
              {editScrap > 0 && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <Label htmlFor="edit-scrap-reason" className="text-red-500 font-semibold">Hurda Sebebi</Label>
                  <Select
                    value={editScrapReasonId || ""}
                    onValueChange={(val) => setEditScrapReasonId(val || "")}
                    items={scrapReasons.map((reason) => ({ value: reason.id, label: reason.reason }))}
                  >
                    <SelectTrigger id="edit-scrap-reason" className="w-full border-red-200 focus:border-red-500">
                      <SelectValue placeholder="Hurda sebebi seçin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {scrapReasons.map((reason) => (
                        <SelectItem key={reason.id} value={reason.id}>
                          {reason.reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Operatörler (Çoklu Seçim)</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    type="button"
                    className="inline-flex items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground w-full text-left font-normal"
                  >
                    <div className="flex items-center gap-2 overflow-hidden truncate">
                      <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {editPersonnelIds.length === 0 ? (
                        <span className="text-muted-foreground">Operatör seçin...</span>
                      ) : (
                        <span className="truncate">
                          {editPersonnelIds
                            .map((pid) => personnelMap.get(pid)?.name)
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      )}
                    </div>
                    <span className="text-muted-foreground text-xs ml-2 shrink-0">
                      ({editPersonnelIds.length})
                    </span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 max-h-60 overflow-y-auto">
                    {personnel.map((p) => {
                      const isChecked = editPersonnelIds.includes(p.id);
                      return (
                        <DropdownMenuCheckboxItem
                          key={p.id}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const newIds = checked
                              ? [...editPersonnelIds, p.id]
                              : editPersonnelIds.filter((id) => id !== p.id);
                            setEditPersonnelIds(newIds);
                          }}
                        >
                          {p.name}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
                {editPersonnelIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {editPersonnelIds.map((pid) => {
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
