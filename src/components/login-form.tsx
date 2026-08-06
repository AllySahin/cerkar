"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, verify2FALogin } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import Image from "next/image";

export default function LoginForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn(username, password);
      if (res.require2FA) {
        setPendingUserId(res.userId);
        setStep(2);
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kullanıcı adı veya şifre hatalı.");
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUserId) return;
    setError("");
    setLoading(true);

    try {
      await verify2FALogin(pendingUserId, totpCode);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "2FA doğrulama kodu hatalı.");
      setLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    setStep(1);
    setPendingUserId(null);
    setTotpCode("");
    setError("");
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <Image
          src="/logo.png"
          alt="Cerkar Makina"
          width={280}
          height={70}
          className="mx-auto mb-2"
          priority
        />
        <p className="text-sm text-muted-foreground">
          {step === 1 ? "Üretim Takip Sistemine Giriş" : "İki Faktörlü Doğrulama (2FA)"}
        </p>
      </CardHeader>
      <CardContent>
        {step === 1 ? (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Kullanıcı Adı</Label>
              <Input
                id="username"
                type="text"
                placeholder="kullanici"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Şifre</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Giriş Yap
            </Button>
          </form>
        ) : (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg text-center space-y-1 border">
              <ShieldCheck className="h-6 w-6 text-primary mx-auto" />
              <p className="text-xs text-muted-foreground">
                <strong>@{username}</strong> hesabınız 2FA korumalıdır.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totpCode">Google Authenticator Kodunuz</Label>
              <Input
                id="totpCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="123456"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.trim())}
                className="text-center text-lg font-mono tracking-widest"
                required
                autoFocus
                autoComplete="off"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <div className="space-y-2 pt-1">
              <Button type="submit" className="w-full" disabled={loading || totpCode.length !== 6}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Doğrula ve Giriş Yap
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-xs text-muted-foreground gap-1"
                onClick={handleBackToStep1}
                disabled={loading}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Giriş Ekranına Dön
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
