import { getMachines } from "@/lib/actions";
import type { Machine } from "@/lib/types";
import AddMachineDialog from "@/components/add-machine-dialog";
import DeleteMachineButton from "@/components/delete-machine-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cog } from "lucide-react";

export default async function MakinelerPage() {
  let machines: Machine[] = [];
  let error: string | null = null;

  try {
    machines = await getMachines();
  } catch (e) {
    error = e instanceof Error ? e.message : "Makineler yüklenirken hata oluştu.";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Makineler</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Üretimde kullanılan makineleri yönetin.
          </p>
        </div>
        <AddMachineDialog />
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      ) : machines.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Cog className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">
              Henüz makine eklenmemiş. Yukarıdaki butonu kullanarak yeni makine ekleyin.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Kayıtlı Makineler ({machines.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {machines.map((machine) => (
                <div
                  key={machine.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-medium">{machine.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Eklenme: {new Date(machine.created_at).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  <DeleteMachineButton id={machine.id} name={machine.name} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
