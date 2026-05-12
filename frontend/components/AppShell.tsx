"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut, Menu, Package, Ship, Truck, ClipboardList,
  LayoutDashboard, Bell, ChevronDown, Users, PlusCircle, UploadCloud
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/lib/types";

const adminNav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/packages/new", label: "Add Package", icon: PlusCircle },
  { href: "/admin/packages", label: "All Packages", icon: Package },
  { href: "/admin/invoices", label: "Invoice Review", icon: ClipboardList },
  { href: "/admin/ship-requests", label: "Ship Requests", icon: Truck },
  { href: "/admin/clients", label: "Clients", icon: Users },
];

const clientNav = [
  { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/packages", label: "My Packages", icon: Package },
  { href: "/client/upload-invoice", label: "Upload Invoice", icon: UploadCloud },
  { href: "/client/request-shipment", label: "Request Shipment", icon: Truck },
  { href: "/client/shipments", label: "Shipment Status", icon: Ship },
];

function activeNavHref(
  pathname: string,
  nav: { href: string }[],
): string | null {
  const sorted = [...nav].map((n) => n.href).sort((a, b) => b.length - a.length);
  for (const href of sorted) {
    if (pathname === href || pathname.startsWith(`${href}/`)) {
      return href;
    }
  }
  return null;
}

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
  const currentNavHref = activeNavHref(pathname, items);

  const breadcrumbTrail =
    pathname.split("/").filter(Boolean).join(" / ").replace(/-/g, " ") ||
    "Dashboard";
  const mobileHeaderTitle =
    pathname.split("/").filter(Boolean).slice(-2).join(" · ").replace(/-/g, " ") ||
    "Dashboard";

  return (
    <div className="flex min-h-screen bg-background text-slate-800">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 px-6 border-b border-white/10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg">
            <Ship className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-wide">Ship2Aruba</span>
        </div>

        <div className="px-4 pt-5 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {role === "admin" ? "Admin Portal" : "Client Portal"}
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-3 pb-4">
          {items.map(({ href, label, icon: Icon }) => {
            const active = href === currentNavHref;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`sidebar-link ${
                  active ? "sidebar-link-active" : "sidebar-link-inactive"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4 space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-sidebar-hover px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#00C9B1] text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { logout(); router.push("/login"); }}
            className="sidebar-link sidebar-link-inactive w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 flex h-14 w-full shrink-0 items-center border-b border-slate-200 bg-white px-4 shadow-sm sm:h-16 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="shrink-0 rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <nav
              className="hidden min-w-0 flex-1 items-center gap-2 overflow-hidden text-sm lg:flex"
              aria-label="Breadcrumb"
            >
              <span className="shrink-0 font-medium text-slate-500">Ship2Aruba</span>
              <span className="shrink-0 text-slate-300">/</span>
              <span className="truncate font-medium capitalize text-slate-800">
                {breadcrumbTrail}
              </span>
            </nav>

            <p
              className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 lg:hidden"
              title={mobileHeaderTitle}
            >
              {mobileHeaderTitle}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 transition-colors">
              <Bell className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00C9B1] text-white text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 leading-tight">{user?.name}</p>
                <p className="text-[10px] text-slate-400 capitalize">{user?.role}</p>
              </div>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </div>
          </div>
        </header>

        <main
          data-app-shell-main
          className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-2 md:px-8 md:pb-8 md:pt-3"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
