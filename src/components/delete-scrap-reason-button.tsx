"use client";

import { useState } from "react";
import { deleteScrapReason } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DeleteScrapReasonButton({
  id,
  reason,
}: {
  id: string;
  reason: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`"${reason}" hurda sebebini silmek istediğinize emin misiniz?`)) return;

    setLoading(true);
    try {
      await deleteScrapReason(id);
      toast.success(`"${reason}" silindi.`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Silme işlemi başarısız."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={loading}
      className="text-destructive hover:text-destructive"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}
