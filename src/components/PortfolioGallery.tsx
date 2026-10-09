"use client";

import { useEffect, useMemo, useState } from "react";
import { JustifiedGrid } from "./JustifiedGrid";
import { Lightbox } from "./Lightbox";
import type { Category, Photo } from "@/lib/types";

type Cat = Category & { photo_count: number };

/** Portfolio filtrable par discipline ; le filtre est reflété dans l'URL (?cat=…). */
export function PortfolioGallery({ photos, categories }: { photos: Photo[]; categories: Cat[] }) {
  const [active, setActive] = useState<string>("tout");
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    const cat = new URLSearchParams(window.location.search).get("cat");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronisation initiale avec l'URL (page statique)
    if (cat && categories.some((c) => c.slug === cat)) setActive(cat);
  }, [categories]);

  const visible = useMemo(
    () => (active === "tout" ? photos : photos.filter((p) => p.category === active)),
    [photos, active],
  );
  const names = useMemo(() => new Map(categories.map((c) => [c.slug, c.name])), [categories]);

  function select(slug: string) {
    setActive(slug);
    const url = new URL(window.location.href);
    if (slug === "tout") url.searchParams.delete("cat");
    else url.searchParams.set("cat", slug);
    window.history.replaceState(null, "", url);
  }

  const chips = [{ slug: "tout", name: "Tout", photo_count: photos.length }, ...categories.filter((c) => c.photo_count > 0)];

  return (
    <>
      <div className="sticky top-16 z-30 -mx-4 mb-8 border-b border-line bg-ink/90 px-4 backdrop-blur-md sm:-mx-8 sm:px-8 md:top-20 lg:-mx-12 lg:px-12">
        <div role="tablist" aria-label="Filtrer par discipline" className="no-scrollbar flex gap-6 overflow-x-auto py-4">
          {chips.map((c) => (
            <button
              key={c.slug}
              type="button"
              role="tab"
              aria-selected={active === c.slug}
              onClick={() => select(c.slug)}
              className={`eyebrow shrink-0 whitespace-nowrap pb-1 transition-colors ${
                active === c.slug ? "border-b border-red text-paper" : "text-paper/50 hover:text-paper"
              }`}
            >
              {c.name} <span className="ml-1 text-paper/40">{c.photo_count}</span>
            </button>
          ))}
        </div>
      </div>
      {visible.length ? (
        <JustifiedGrid photos={visible} onOpen={setIndex} />
      ) : (
        <p className="py-24 text-center text-paper/50">Aucune photo dans cette discipline pour le moment.</p>
      )}
      <Lightbox
        photos={visible}
        index={index}
        onIndexChange={setIndex}
        caption={(p) => [p.title, p.category ? names.get(p.category) : null].filter(Boolean).join(" — ")}
      />
    </>
  );
}
