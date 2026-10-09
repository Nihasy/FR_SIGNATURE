import { SiteFooter } from "@/components/SiteFooter";
import { Suspense } from "react";
import { SiteHeader, SiteHeaderFallback } from "@/components/SiteHeader";

// Tout le site public est servi depuis du statique (données en `use cache`, invalidées par le back-office).
// Une série jamais visitée attend son rendu statique plutôt que de streamer une coquille.
export const ensureStatic = "navigation";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#contenu"
        className="eyebrow fixed left-4 top-4 z-[70] -translate-y-24 bg-red px-4 py-3 text-white focus:translate-y-0"
      >
        Aller au contenu
      </a>
      <Suspense fallback={<SiteHeaderFallback />}>
        <SiteHeader />
      </Suspense>
      <main id="contenu">{children}</main>
      <SiteFooter />
    </>
  );
}
