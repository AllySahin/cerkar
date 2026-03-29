import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import Sidebar from "@/components/navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cerkar Makina - Üretim Takip Sistemi",
  description: "Cerkar Makina günlük üretim verilerini süreç bazlı kaydeden ve raporlayan yönetim paneli.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen overflow-auto">
          <main className="flex-1 px-6 py-8">
            {children}
          </main>
          <footer className="border-t py-3">
            <div className="px-6 text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} Cerkar Makina — Üretim Takip Sistemi
            </div>
          </footer>
        </div>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
