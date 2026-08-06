"use client";

import { useState } from "react";
import { createUser, updateUserRole, deleteUser, disableTotp } from "@/lib/actions";
import type { Profile, UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2, Loader2, Shield, User, ShieldCheck, ShieldAlert, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import TotpSetupModal from "@/components/totp-setup-modal";

interface UserManagementProps {
  profiles: Profile[];
  currentUserId: string;
}

export default function UserManagement({ profiles, currentUserId }: UserManagementProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [disablingTotpId, setDisablingTotpId] = useState<string | null>(null);

  const currentProfile = profiles.find((p) => p.id === currentUserId);

  const handleCreate = async () => {
    if (!username || !password) {
      toast.error("Kullanıcı adı ve şifre zorunludur.");
      return;
    }
    if (password.length < 4) {
      toast.error("Şifre en az 4 karakter olmalıdır.");
      return;
    }

    setSaving(true);
    try {
      await createUser(username, password, fullName, role);
      toast.success("Kullanıcı başarıyla oluşturuldu.");
      setOpen(false);
      setUsername("");
      setPassword("");
      setFullName("");
      setRole("user");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Kullanıcı oluşturulamadı."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId);
    try {
      await updateUserRole(userId, newRole);
      toast.success("Yetki seviyesi güncellendi.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Yetki güncellenemedi."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) return;

    setDeletingId(userId);
    try {
      await deleteUser(userId);
      toast.success("Kullanıcı silindi.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Kullanıcı silinemedi."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleDisableTotp = async (userId: string) => {
    if (!confirm("Bu hesabın Google Authenticator (2FA) korumasını kaldırmak istediğinize emin misiniz?")) return;

    setDisablingTotpId(userId);
    try {
      await disableTotp(userId);
      toast.success("2FA koruması kaldırıldı.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "2FA kaldırılamadı."
      );
    } finally {
      setDisablingTotpId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Kullanıcı Ekle Butonu ve Diyaloğu */}
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            <UserPlus className="h-4 w-4" />
            Kullanıcı Ekle
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Ad Soyad</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ali Şahin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newUsername">Kullanıcı Adı</Label>
                <Input
                  id="newUsername"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="kullanici"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Şifre</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="En az 4 karakter"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Yetki Seviyesi</Label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as UserRole)}
                  items={[
                    { value: "admin", label: "Admin" },
                    { value: "user", label: "Kullanıcı" },
                  ]}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">Kullanıcı</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Kullanıcı Oluştur
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kullanıcı Listesi */}
      <Card>
        <CardHeader>
          <CardTitle>Kullanıcılar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>Kullanıcı Adı</TableHead>
                  <TableHead>Yetki</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">
                      {profile.full_name || "-"}
                      {profile.id === currentUserId && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Sen
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{profile.username}</TableCell>
                    <TableCell>
                      {profile.id === currentUserId ? (
                        <Badge variant={profile.role === "admin" ? "default" : "secondary"}>
                          {profile.role === "admin" ? (
                            <><Shield className="h-3 w-3 mr-1" /> Admin</>
                          ) : (
                            <><User className="h-3 w-3 mr-1" /> Kullanıcı</>
                          )}
                        </Badge>
                      ) : (
                        <Select
                          value={profile.role}
                          onValueChange={(v) => handleRoleChange(profile.id, v as UserRole)}
                          disabled={updatingId === profile.id}
                          items={[
                            { value: "admin", label: "Admin" },
                            { value: "user", label: "Kullanıcı" },
                          ]}
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="user">Kullanıcı</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(profile.created_at).toLocaleDateString("tr-TR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Admin, 2FA kilitlenmiş diğer kullanıcıların 2FA'sını kaldırabilir */}
                        {profile.is_totp_enabled && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="2FA Korumasını Kaldır"
                            onClick={() => handleDisableTotp(profile.id)}
                            disabled={disablingTotpId === profile.id}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          >
                            {disablingTotpId === profile.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ShieldAlert className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {profile.id !== currentUserId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Kullanıcıyı Sil"
                            onClick={() => handleDelete(profile.id)}
                            disabled={deletingId === profile.id}
                            className="text-destructive hover:text-destructive"
                          >
                            {deletingId === profile.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
