import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <p className="text-6xl font-black text-brand">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        Page introuvable
      </h1>
      <p className="mt-2 max-w-md text-slate-600">
        Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <Link href="/" className="btn-primary mt-6">
        Retour à l'accueil
      </Link>
    </div>
  );
}
