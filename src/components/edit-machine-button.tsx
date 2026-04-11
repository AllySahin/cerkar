"use client";

import { useState } from "react";
import { updateMachine } from "@/lib/actions";
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

export default function EditMachineButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState(name);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Makine adı boş olamaz.");
      return;
    }

    setLoading(true);
    try {
      await updateMachine(id, newName);
      toast.success("Makine güncellendi.");
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
          setNewName(name);
          setOpen(true);
        }}
        className="h-8 w-8 p-0"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Makineyi Düzenle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-machine-name">Makine Adı</Label>
              <Input
                id="edit-machine-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
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
