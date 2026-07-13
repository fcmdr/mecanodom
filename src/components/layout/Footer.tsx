import Link from "next/link";
import { navLinks, legalLinks } from "@/lib/site";
import type { SiteConfig } from "@/lib/tenant";

export function Footer({ site }: { site: SiteConfig }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-base font-black text-white">
              M
            </span>
            <span className="text-base font-bold text-slate-900">
              {site.name}
            </span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-slate-600">
            {site.tagline}. Intervention rapide et transparente en{" "}
            {site.address}.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Navigation</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-slate-600 hover:text-brand"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <a href={site.phoneHref} className="hover:text-brand">
                {site.phone}
              </a>
            </li>
            <li>
              <a href={site.emailHref} className="hover:text-brand">
                {site.email}
              </a>
            </li>
            <li>{site.hoursSummary}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-200 py-4">
        <div className="container-page flex flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row">
          <p>
            © {year} {site.name}. Tous droits réservés.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-brand"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/admin" className="hover:text-brand">
              Espace administrateur
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
