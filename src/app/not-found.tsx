import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="container-x flex min-h-[100svh] flex-col justify-center py-24">
      <Link href="/" aria-label="Accueil">
        <Logo />
      </Link>
      <p className="eyebrow mt-16 text-red">Erreur 404</p>
      <h1 className="display mt-6 text-7xl sm:text-9xl">Hors piste.</h1>
      <p className="mt-6 max-w-md text-paper/60">Cette page n&apos;existe pas ou a été déplacée.</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-red">
          Retour à l&apos;accueil
        </Link>
        <Link href="/portfolio" className="btn btn-ghost">
          Voir le portfolio
        </Link>
      </div>
    </main>
  );
}
