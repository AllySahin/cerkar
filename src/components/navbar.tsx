"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Factory,
  LayoutDashboard,
  PlusCircle,
  Package,
  Cog,
  PanelLeftClose,
  PanelLeft,
  History,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/uretim", label: "Üretim Girişi", icon: PlusCircle },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/gecmis", label: "Geçmiş", icon: History },
  { href: "/rapor", label: "Rapor", icon: FileSpreadsheet },
  { href: "/urunler", label: "Ürünler", icon: Package },
  { href: "/makineler", label: "Makineler", icon: Cog },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Factory className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-sm leading-tight tracking-tight text-sidebar-foreground">
              CERKAR MAKİNA
            </span>
            <span className="text-[10px] text-sidebar-foreground/60 leading-tight">
              Üretim Takip Sistemi
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 p-2 mt-2">
        {navItems.map((item) => {
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

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
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
