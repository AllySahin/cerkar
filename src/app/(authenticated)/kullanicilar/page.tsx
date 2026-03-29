import { getCurrentProfile, getProfiles } from "@/lib/actions";
import { redirect } from "next/navigation";
import UserManagement from "@/components/user-management";

export default async function KullanicilarPage() {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  let profiles: Awaited<ReturnType<typeof getProfiles>> = [];
  let error: string | null = null;

  try {
    profiles = await getProfiles();
  } catch (e) {
    error = e instanceof Error ? e.message : "Kullanıcılar yüklenirken hata oluştu.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kullanıcı Yönetimi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kullanıcıları ekleyin, düzenleyin ve yetki seviyelerini yönetin.
        </p>
      </div>
      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-6 text-center">
          <p className="text-destructive font-medium">{error}</p>
        </div>
      ) : (
        <UserManagement profiles={profiles} currentUserId={profile.id} />
      )}
    </div>
  );
}
