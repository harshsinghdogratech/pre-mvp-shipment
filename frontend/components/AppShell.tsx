"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut, Menu, Package, Ship, Truck, ClipboardList,
  LayoutDashboard, Bell, ChevronDown, User
} from "lucide-react";
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
    <div className="flex min-h-screen bg-background text-slate-800">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-white/10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg">
            <Ship className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-wide">ShipFlow</span>
        </div>

        {/* Nav Label */}
        <div className="px-4 pt-5 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            {role === "admin" ? "Admin Panel" : "Client Panel"}
          </p>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 space-y-1 px-3 pb-4">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
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

        {/* User Info + Logout */}
        <div className="border-t border-white/10 p-4 space-y-3">
          <div className="flex items-center gap-3 rounded-xl bg-sidebar-hover px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
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

      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
          {/* Mobile menu toggle */}
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden transition-colors"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Breadcrumb */}
          <div className="hidden lg:flex items-center gap-2 text-sm">
            <span className="text-slate-400">ShipFlow</span>
            <span className="text-slate-300">/</span>
            <span className="font-medium text-slate-700 capitalize">
              {pathname.split("/").filter(Boolean).join(" / ").replace(/-/g, " ") || "Dashboard"}
            </span>
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-3">
            <button className="relative rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 transition-colors">
              <Bell className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 cursor-pointer hover:bg-slate-50 transition-colors">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
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

        <main className="flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
