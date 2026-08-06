"use client";

import { useState } from "react";
import { setupTotp, confirmEnableTotp } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, ShieldCheck, Copy, Check, QrCode } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface TotpSetupModalProps {
  children?: React.ReactNode;
}

export default function TotpSetupModal({ children }: TotpSetupModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !secret) {
      setLoading(true);
      try {
        const res = await setupTotp();
        setSecret(res.secret);
        setQrCodeUrl(res.qrCodeUrl);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "2FA kurulumu başlatılamadı."
        );
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCopySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      toast.success("Gizli anahtar kopyalandı!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret || !code || code.length !== 6) {
      toast.error("Lütfen 6 haneli doğrulama kodunu girin.");
      return;
    }

    setConfirming(true);
    try {
      await confirmEnableTotp(secret, code);
      toast.success("Google Authenticator 2FA başarıyla aktif edildi!");
      setOpen(false);
      setCode("");
      setSecret(null);
      setQrCodeUrl(null);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "2FA doğrulanamadı."
      );
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          (children as React.ReactElement) || (
            <Button variant="outline" className="gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              2FA Aktifleştir
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Google Authenticator (2FA) Kurulumu
          </DialogTitle>
          <DialogDescription>
            Hesabınızı iki faktörlü kimlik doğrulama ile korumak için aşağıdaki adımları izleyin.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Karekod oluşturuluyor...</p>
          </div>
        ) : (
          <form onSubmit={handleConfirm} className="space-y-4 pt-2">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                1. Aşama: Uygulamaya Ekle
              </p>
              <div className="flex flex-col items-center justify-center p-4 bg-muted/40 rounded-lg border text-center">
                {qrCodeUrl ? (
                  <div className="bg-white p-2 rounded-lg shadow-sm mb-3">
                    <Image
                      src={qrCodeUrl}
                      alt="2FA QR Code"
                      width={180}
                      height={180}
                      className="mx-auto"
                    />
                  </div>
                ) : (
                  <QrCode className="h-16 w-16 text-muted mb-2" />
                )}
                <p className="text-xs text-muted-foreground max-w-xs">
                  Mobil cihazınızdaki <strong>Google Authenticator</strong> veya uyumlu 2FA uygulamasını açıp QR kodu taratın.
                </p>
              </div>

              {/* Manuel Kod */}
              {secret && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Kodu taratamıyorsanız manuel girin:</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-muted px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wider select-all border">
                      {secret}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleCopySecret}
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <hr className="my-2" />

            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                2. Aşama: Kod Doğrulama
              </p>
              <div className="space-y-2">
                <Label htmlFor="totpCode">Google Authenticator Kodunuz</Label>
                <Input
                  id="totpCode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.trim())}
                  className="text-center text-lg font-mono tracking-widest"
                  required
                  autoComplete="off"
                />
              </div>
              <Button
                type="submit"
                className="w-full gap-2"
                disabled={confirming || code.length !== 6}
              >
                {confirming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Doğrula ve Aktifleştir
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
