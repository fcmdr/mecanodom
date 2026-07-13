import { Suspense } from "react";
import { getSiteConfig } from "@/lib/tenant";
import { LoginForm } from "./LoginForm";

export default async function AdminLoginPage() {
  const site = await getSiteConfig();
  return (
    <Suspense>
      <LoginForm siteName={site.name} />
    </Suspense>
  );
}
