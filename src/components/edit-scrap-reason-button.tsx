"use client";

import { useState } from "react";
import { updateScrapReason } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EditScrapReasonButton({
  id,
  reason,
}: {
  id: string;
  reason: string;
}) {
  const [open, setOpen] = useState(false);
  const [newReason, setNewReason] = useState(reason);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReason.trim()) {
      toast.error("Hurda sebebi boş olamaz.");
      return;
    }

    setLoading(true);
    try {
      await updateScrapReason(id, newReason);
      toast.success("Hurda sebebi güncellendi.");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Güncelleme başarısız."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setNewReason(reason);
          setOpen(true);
        }}
        className="h-8 w-8 p-0"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hurda Sebebini Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-scrap-reason">Hurda Sebebi Tanımı</Label>
              <Input
                id="edit-scrap-reason"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Güncelle
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
