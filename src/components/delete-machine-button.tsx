"use client";

import { useState } from "react";
import { deleteMachine } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DeleteMachineButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`"${name}" makinesini silmek istediğinize emin misiniz?`)) return;

    setLoading(true);
    try {
      await deleteMachine(id);
      toast.success(`"${name}" silindi.`);
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
