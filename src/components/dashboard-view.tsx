"use client";

import { useState, useEffect } from "react";
import { getDashboardData, getAvailableDates } from "@/lib/actions";
import type { ProductionLogWithRelations } from "@/lib/types";
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
import { Separator } from "@/components/ui/separator";
import ComparisonBadge from "@/components/comparison-badge";
import {
  BarChart3,
  Calendar,
  Package,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface DashboardLog extends ProductionLogWithRelations {
  comparison: {
    current_total: number;
    previous_total: number;
    previous_date: string | null;
    change_percent: number | null;
  } | null;
}

export default function DashboardView() {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [logs, setLogs] = useState<DashboardLog[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAvailableDates().then(setAvailableDates).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    getDashboardData(date)
      .then((data) => setLogs(data as DashboardLog[]))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [date]);

  const totalGood = logs.reduce((sum, l) => sum + l.good_quantity, 0);
  const totalScrap = logs.reduce((sum, l) => sum + l.scrap_quantity, 0);
  const totalAll = totalGood + totalScrap;
  const scrapRate = totalAll > 0 ? ((totalScrap / totalAll) * 100).toFixed(1) : "0";
  const uniqueProducts = new Set(logs.map((l) => l.product_id)).size;

  return (
    <div className="space-y-6">
      {/* Tarih Seçimi ve Özet */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Tarih
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {availableDates.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {availableDates.length} farklı gün kaydı mevcut
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Üretim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAll.toLocaleString("tr-TR")}</div>
            <p className="text-xs text-muted-foreground">adet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Sağlam
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {totalGood.toLocaleString("tr-TR")}
            </div>
            <p className="text-xs text-muted-foreground">adet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Hurda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalScrap.toLocaleString("tr-TR")}
            </div>
            <p className="text-xs text-muted-foreground">%{scrapRate} hurda oranı</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Ürün
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueProducts}</div>
            <p className="text-xs text-muted-foreground">farklı parça</p>
          </CardContent>
        </Card>
      </div>

      {/* Detay Tablosu */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Yükleniyor...</span>
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">
              Bu tarih için kayıt bulunamadı.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Günlük Üretim Detayı
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
                  <TableHead className="text-right">Kıyaslama</TableHead>
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
                    <TableCell className="text-right">
                      <ComparisonBadge
                        changePercent={log.comparison?.change_percent ?? null}
                        previousDate={log.comparison?.previous_date ?? null}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>TOPLAM</TableCell>
                  <TableCell />
                  <TableCell className="text-center text-emerald-600">
                    {totalGood}
                  </TableCell>
                  <TableCell className="text-center text-red-600">
                    {totalScrap}
                  </TableCell>
                  <TableCell className="text-center">
                    {totalAll}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
