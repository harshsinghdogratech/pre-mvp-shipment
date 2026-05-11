"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Package, Ship, Truck, ClipboardList, LayoutDashboard, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/lib/types";

const adminNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/packages", label: "Packages", icon: Package },
  { href: "/admin/invoices", label: "Invoice Reviews", icon: ClipboardList },
  { href: "/admin/shipments", label: "Shipment Requests", icon: Truck },
  { href: "/admin/shipped", label: "Shipped Packages", icon: Ship },
];

const clientNav = [
  { href: "/client", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/packages", label: "My Packages", icon: Package },
  { href: "/client/shipments", label: "Shipment Status", icon: Ship },
];

export function AppShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = role === "admin" ? adminNav : clientNav;

  return (
    <div className="flex min-h-screen bg-background selection:bg-accent/30 text-slate-200">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-white/5 bg-panel transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/5 px-6 font-bold text-white tracking-wide">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent to-accent-purple flex items-center justify-center shadow-neon-blue">
            <Ship className="w-4 h-4 text-white" />
          </div>
          ShipFlow
        </div>
        <nav className="flex flex-col gap-2 p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-2">
            {role === "admin" ? "Admin Panel" : "Client Panel"}
          </div>
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                  active
                    ? "bg-accent/10 text-accent-cyan shadow-[inset_4px_0_0_0_rgba(34,211,238,1)]"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-accent-cyan" : ""}`} />
                {label}
              </Link>
            );
          })}
          
          <div className="mt-8 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 ml-2">
            Settings
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-accent-error hover:bg-accent-error/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </nav>
      </aside>
      
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      
      <div className="flex min-h-screen flex-1 flex-col lg:pl-0 relative overflow-hidden">
        {/* Abstract background glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent-purple/20 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[120px] pointer-events-none" />
        
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/5 bg-panel/40 px-6 backdrop-blur-xl">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 lg:hidden transition-colors"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="hidden lg:flex items-center text-sm text-slate-400">
            <span className="capitalize">{pathname.split('/').filter(Boolean)[1]?.replace('-', ' ') || 'Dashboard'}</span>
          </div>

          <div className="ml-auto flex items-center gap-4 text-sm">
            <div className="flex items-center gap-3 bg-white/5 rounded-full pl-2 pr-4 py-1 border border-white/10">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-accent-cyan flex items-center justify-center shadow-lg">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-200 leading-tight">{user?.name}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{user?.role}</span>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 relative z-10">{children}</main>
      </div>
    </div>
  );
}
