import { getScrapReasons, getCurrentProfile } from "@/lib/actions";
import type { ScrapReason } from "@/lib/types";
import AddScrapReasonDialog from "@/components/add-scrap-reason-dialog";
import EditScrapReasonButton from "@/components/edit-scrap-reason-button";
import DeleteScrapReasonButton from "@/components/delete-scrap-reason-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default async function HurdaSebepleriPage() {
  let reasons: ScrapReason[] = [];
  let error: string | null = null;
  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === "admin";

  try {
    reasons = await getScrapReasons();
  } catch (e) {
    error = e instanceof Error ? e.message : "Hurda sebepleri yüklenirken hata oluştu.";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hurda Sebepleri</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Üretim sırasında hurda olarak işaretlenen ürünler için tanımlı sebepleri yönetin.
          </p>
        </div>
        {isAdmin && <AddScrapReasonDialog />}
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      ) : reasons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShieldAlert className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">
              Henüz hurda sebebi eklenmemiş. Yukarıdaki butonu kullanarak yeni sebep ekleyin.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Kayıtlı Hurda Sebepleri ({reasons.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {reasons.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 hover:bg-muted/30 px-2 rounded-md transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.reason}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Eklenme: {new Date(item.created_at).toLocaleDateString("tr-TR")}
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <EditScrapReasonButton id={item.id} reason={item.reason} />
                      <DeleteScrapReasonButton id={item.id} reason={item.reason} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
