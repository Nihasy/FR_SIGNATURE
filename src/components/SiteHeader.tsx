"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav } from "@/lib/site";
import { Logo } from "./Logo";

/** En-tête statique servi dans la coquille pré-rendue, avant que le chemin courant soit connu. */
export function SiteHeaderFallback() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-gradient-to-b from-black/60 to-transparent">
      <div className="container-x flex h-16 items-center justify-between md:h-20">
        <Link href="/" className="text-[0.95rem] md:text-base" aria-label="Accueil FR Signature Auto">
          <Logo />
        </Link>
        <nav aria-label="Navigation principale" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="eyebrow link-underline pb-1 text-paper/70 hover:text-paper">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <span className="h-11 w-11 md:hidden" />
      </div>
    </header>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [openFor, setOpenFor] = useState<string | null>(null);
  // Le menu se referme tout seul quand l'URL change.
  const open = openFor === pathname;
  const overHero = pathname === "/" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-500 ${
        overHero && !open ? "bg-gradient-to-b from-black/60 to-transparent" : "bg-ink/90 backdrop-blur-md"
      }`}
    >
      <div className="container-x flex h-16 items-center justify-between md:h-20">
        <Link href="/" className="text-[0.95rem] md:text-base" aria-label="Accueil FR Signature Auto">
          <Logo />
        </Link>
        <nav aria-label="Navigation principale" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`eyebrow link-underline pb-1 ${active ? "text-paper" : "text-paper/70 hover:text-paper"}`}
                    style={active ? { backgroundSize: "100% 1px" } : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <button
          type="button"
          className="relative z-50 -mr-2 flex h-11 w-11 items-center justify-center md:hidden"
          aria-expanded={open}
          aria-controls="menu-mobile"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpenFor(open ? null : pathname)}
        >
          <span className="relative block h-3 w-6">
            <span className={`absolute left-0 block h-0.5 w-6 bg-paper transition-all duration-300 ${open ? "top-1.5 rotate-45" : "top-0"}`} />
            <span className={`absolute left-0 block h-0.5 w-6 bg-paper transition-all duration-300 ${open ? "top-1.5 -rotate-45" : "top-3"}`} />
          </span>
        </button>
      </div>
      {open && (
        <div id="menu-mobile" className="fixed inset-0 top-16 z-40 bg-ink md:hidden">
          <nav aria-label="Navigation mobile" className="container-x flex h-full flex-col justify-between pb-10 pt-8">
            <ul className="space-y-2">
              {[{ href: "/", label: "Accueil" }, ...nav].map((item, i) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpenFor(null)}
                    className="display flex items-baseline gap-4 py-1 text-5xl"
                  >
                    <span className="eyebrow text-red">{String(i + 1).padStart(2, "0")}</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="eyebrow text-paper/50">Passion · Authenticité · Qualité</p>
          </nav>
        </div>
      )}
    </header>
  );
}
