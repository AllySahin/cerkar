"use client";

import { useState } from "react";
import { createScrapReason } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AddScrapReasonDialog() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Hurda sebebi boş olamaz.");
      return;
    }

    setLoading(true);
    try {
      await createScrapReason(reason);
      toast.success(`"${reason}" hurda sebebi eklendi.`);
      setReason("");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Hurda sebebi eklenirken hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground"
      >
        <Plus className="h-4 w-4" />
        Yeni Hurda Sebebi
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Hurda Sebebi Eklentisi</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="scrap-reason">Hurda Sebebi Tanımı</Label>
            <Input
              id="scrap-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Örn: Ölçü Hatası"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              İptal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Ekle
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
