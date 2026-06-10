"use client";

import { useState } from "react";
import { deletePersonnel } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DeletePersonnelButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`"${name}" personelini silmek istediğinize emin misiniz?`)) return;

    setLoading(true);
    try {
      await deletePersonnel(id);
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
      className="text-destructive hover:text-destructive h-8 w-8 p-0"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}
