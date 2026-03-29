"use client";

import { useState } from "react";
import { createMachine } from "@/lib/actions";
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

export default function AddMachineDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Makine adı boş olamaz.");
      return;
    }

    setLoading(true);
    try {
      await createMachine(name);
      toast.success(`"${name}" makinesi eklendi.`);
      setName("");
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Makine eklenirken hata oluştu."
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
        Yeni Makine
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Makine Ekle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="machine-name">Makine Adı</Label>
            <Input
              id="machine-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: CNC-01"
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
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Ekle
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
