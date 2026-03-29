"use client";

import { useState } from "react";
import { getReportData } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Loader2, FileSpreadsheet, Search, CalendarDays, CalendarRange, Calendar } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type ReportRow = Awaited<ReturnType<typeof getReportData>>[number];

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

export default function ReportView() {
  const today = new Date();
  const todayStr = formatDate(today);
  const thirtyDaysAgo = formatDate(new Date(today.getTime() - 30 * 86400000));

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(todayStr);
  const [data, setData] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const setDaily = () => {
    setStartDate(todayStr);
    setEndDate(todayStr);
  };

  const setWeekly = () => {
    // Bir önceki haftanın Pazartesi-Pazar aralığı
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Pazar
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const thisMonday = new Date(now);
    thisMonday.setDate(now.getDate() - diffToMonday);
    const prevMonday = new Date(thisMonday);
    prevMonday.setDate(thisMonday.getDate() - 7);
    const prevSunday = new Date(thisMonday);
    prevSunday.setDate(thisMonday.getDate() - 1);
    setStartDate(formatDate(prevMonday));
    setEndDate(formatDate(prevSunday));
  };

  const setMonthly = () => {
    // Bir önceki ayın ilk ve son günü
    const now = new Date();
    const firstOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    setStartDate(formatDate(firstOfPrevMonth));
    setEndDate(formatDate(lastOfPrevMonth));
  };

  const fetchData = async () => {
    if (!startDate || !endDate) {
      toast.error("Lütfen tarih aralığı seçin.");
      return;
    }
    if (startDate > endDate) {
      toast.error("Başlangıç tarihi, bitiş tarihinden sonra olamaz.");
      return;
    }

    setLoading(true);
    try {
      const result = await getReportData(startDate, endDate);
      setData(result);
      setFetched(true);
      if (result.length === 0) {
        toast.info("Seçilen tarih aralığında kayıt bulunamadı.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Veriler yüklenirken hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (data.length === 0) {
      toast.error("İndirilecek veri yok.");
      return;
    }

    const rows = data.map((row) => ({
      Tarih: row.date,
      Ürün: (row.products as { name: string })?.name ?? "-",
      Makine: (row.machines as { name: string } | null)?.name ?? "-",
      "Sağlam Adet": row.good_quantity,
      "Hurda Adet": row.scrap_quantity,
      "Toplam Adet": row.total_quantity,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Sütun genişliklerini ayarla
    ws["!cols"] = [
      { wch: 12 },
      { wch: 25 },
      { wch: 20 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Üretim Raporu");

    XLSX.writeFile(wb, `Cerkar_Uretim_Raporu_${startDate}_${endDate}.xlsx`);
    toast.success("Excel dosyası indirildi!");
  };

  const totalGood = data.reduce((sum, r) => sum + r.good_quantity, 0);
  const totalScrap = data.reduce((sum, r) => sum + r.scrap_quantity, 0);
  const totalAll = data.reduce((sum, r) => sum + r.total_quantity, 0);

  return (
    <div className="space-y-6">
      {/* Tarih Aralığı Seçimi */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Rapor Oluştur
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Hızlı Erişim Butonları */}
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={setDaily}>
              <CalendarDays className="h-4 w-4 mr-1.5" />
              Günlük (Bugün)
            </Button>
            <Button variant="secondary" size="sm" onClick={setWeekly}>
              <CalendarRange className="h-4 w-4 mr-1.5" />
              Haftalık (Önceki Hafta)
            </Button>
            <Button variant="secondary" size="sm" onClick={setMonthly}>
              <Calendar className="h-4 w-4 mr-1.5" />
              Aylık (Önceki Ay)
            </Button>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Başlangıç Tarihi</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-48"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Bitiş Tarihi</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-48"
              />
            </div>
            <Button onClick={fetchData} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Verileri Getir
            </Button>
            {data.length > 0 && (
              <Button variant="outline" onClick={exportToExcel}>
                <Download className="h-4 w-4 mr-2" />
                Excel İndir
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Özet Kartları */}
      {fetched && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Toplam Kayıt</p>
              <p className="text-2xl font-bold">{data.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Sağlam Adet</p>
              <p className="text-2xl font-bold text-green-600">{totalGood.toLocaleString("tr-TR")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Hurda Adet</p>
              <p className="text-2xl font-bold text-red-600">{totalScrap.toLocaleString("tr-TR")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Toplam Üretim</p>
              <p className="text-2xl font-bold">{totalAll.toLocaleString("tr-TR")}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Veri Tablosu */}
      {fetched && (
        <Card>
          <CardContent className="pt-6">
            {data.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Seçilen tarih aralığında kayıt bulunamadı.
              </p>
            ) : (
              <div className="rounded-md border overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarih</TableHead>
                      <TableHead>Ürün</TableHead>
                      <TableHead>Makine</TableHead>
                      <TableHead className="text-right">Sağlam</TableHead>
                      <TableHead className="text-right">Hurda</TableHead>
                      <TableHead className="text-right">Toplam</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell className="font-medium">
                          {(row.products as { name: string })?.name ?? "-"}
                        </TableCell>
                        <TableCell>
                          {(row.machines as { name: string } | null)?.name ?? "-"}
                        </TableCell>
                        <TableCell className="text-right">{row.good_quantity}</TableCell>
                        <TableCell className="text-right">{row.scrap_quantity}</TableCell>
                        <TableCell className="text-right font-medium">
                          {row.total_quantity}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
