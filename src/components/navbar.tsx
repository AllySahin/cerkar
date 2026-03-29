"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  Cog,
  PanelLeftClose,
  PanelLeft,
  History,
  FileSpreadsheet,
  Users,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { signOut } from "@/lib/actions";
import type { UserRole } from "@/lib/types";

const navItems = [
  { href: "/uretim", label: "Üretim Girişi", icon: PlusCircle, adminOnly: false },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/gecmis", label: "Geçmiş", icon: History, adminOnly: false },
  { href: "/rapor", label: "Rapor", icon: FileSpreadsheet, adminOnly: false },
  { href: "/urunler", label: "Ürünler", icon: Package, adminOnly: false },
  { href: "/makineler", label: "Makineler", icon: Cog, adminOnly: false },
  { href: "/kullanicilar", label: "Kullanıcılar", icon: Users, adminOnly: true },
];

interface SidebarProps {
  userRole: UserRole;
  username: string;
  userName: string;
}

export default function Sidebar({ userRole, username, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = userRole === "admin";
  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-center px-2 h-16 border-b border-sidebar-border">
        {collapsed ? (
          <Image
            src="/logo.png"
            alt="Cerkar Makina"
            width={36}
            height={36}
            className="object-contain"
          />
        ) : (
          <Image
            src="/logo.png"
            alt="Cerkar Makina"
            width={180}
            height={45}
            className="object-contain"
          />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 p-2 mt-2">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "flex items-center gap-3 rounded-md text-sm font-medium transition-colors",
                collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Kullanıcı Bilgisi & Çıkış */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        {!collapsed && (
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-sidebar-foreground truncate">
              {userName || username}
            </p>
            <p className="text-[10px] text-sidebar-foreground/50 truncate">
              {isAdmin ? "Admin" : "Kullanıcı"}
            </p>
          </div>
        )}
        <button
          onClick={handleSignOut}
          title="Çıkış Yap"
          className={cn(
            "flex w-full items-center gap-2 rounded-md text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
            collapsed ? "justify-center px-2 py-2" : "px-3 py-2"
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Çıkış Yap</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex w-full items-center gap-2 rounded-md text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors",
            collapsed ? "justify-center px-2 py-2" : "px-3 py-2"
          )}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span>Daralt</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
