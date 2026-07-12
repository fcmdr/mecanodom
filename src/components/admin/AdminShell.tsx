"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const adminLinks = [
  { href: "/admin", label: "Tableau de bord", exact: true },
  { href: "/admin/calendrier", label: "Calendrier" },
  { href: "/admin/reservations", label: "Réservations" },
  { href: "/admin/services", label: "Prestations & tarifs" },
  { href: "/admin/disponibilites", label: "Disponibilités" },
  { href: "/admin/zones", label: "Zones d'intervention" },
];

export function AdminShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {adminLinks.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 flex-col bg-slate-900 p-4 md:flex">
        <Link href="/admin" className="mb-6 flex items-center gap-2 px-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-lg font-black text-white">
            M
          </span>
          <span className="font-bold text-white">Admin</span>
        </Link>
        {nav}
        <div className="mt-auto border-t border-slate-800 pt-4">
          <p className="truncate px-3 text-xs text-slate-400">{email}</p>
          <button
            onClick={handleLogout}
            className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Déconnexion
          </button>
          <Link
            href="/"
            className="mt-1 block rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ← Voir le site
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <span className="font-bold text-slate-900">Admin</span>
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 hover:bg-slate-100"
            aria-label="Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        {open && (
          <div className="border-b border-slate-800 bg-slate-900 p-4 md:hidden">
            {nav}
            <button
              onClick={handleLogout}
              className="mt-3 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              Déconnexion
            </button>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
