import Sidebar from "@/components/navbar";
import { getCurrentProfile } from "@/lib/actions";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  return (
    <div className="flex h-full">
      <Sidebar userRole={profile?.role ?? "user"} username={profile?.username ?? ""} userName={profile?.full_name ?? ""} />
      <div className="flex-1 flex flex-col min-h-screen overflow-auto">
        <main className="flex-1 px-6 py-8">{children}</main>
        <footer className="border-t py-3">
          <div className="px-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Cerkar Makina — Üretim Takip Sistemi
          </div>
        </footer>
      </div>
    </div>
  );
}
