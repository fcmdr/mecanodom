"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

/** Bouton de soumission avec confirmation (pour suppressions). */
export function ConfirmSubmit({
  children,
  confirmMessage = "Êtes-vous sûr ?",
  className,
}: {
  children: React.ReactNode;
  confirmMessage?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
      className={cn(className ?? "text-sm font-medium text-red-600 hover:text-red-700")}
    >
      {children}
    </button>
  );
}
