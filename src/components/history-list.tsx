"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History, Search } from "lucide-react";

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
}

export default function HistoryList({ initialLogs }: HistoryListProps) {
  const [search, setSearch] = useState("");

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
    </div>
  );
}
