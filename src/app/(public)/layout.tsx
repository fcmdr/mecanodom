import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getSiteConfig } from "@/lib/tenant";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = await getSiteConfig();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar siteName={site.name} />
      <main className="flex-1">{children}</main>
      <Footer site={site} />
    </div>
  );
}
