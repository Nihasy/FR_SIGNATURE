"use client";

import { useState } from "react";
import { Img } from "./Img";
import { Lightbox } from "./Lightbox";
import { Reveal } from "./Reveal";
import type { Photo } from "@/lib/types";

// Mise en page éditoriale asymétrique (12 colonnes), répétée par blocs de 6.
const LAYOUT = [
  "md:col-span-7 aspect-[4/3]",
  "md:col-span-5 aspect-[4/5]",
  "md:col-span-4 aspect-[4/5]",
  "md:col-span-8 aspect-[16/10]",
  "md:col-span-6 aspect-[3/2]",
  "md:col-span-6 aspect-[3/2]",
];

export function FeaturedGrid({ photos }: { photos: Photo[] }) {
  const [index, setIndex] = useState<number | null>(null);
  return (
    <>
      <ul className="grid grid-cols-1 gap-2 md:grid-cols-12 md:gap-3">
        {photos.map((photo, i) => (
          <Reveal as="li" key={photo.id} className={`relative ${LAYOUT[i % LAYOUT.length]}`} delay={(i % 2) * 120}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="group absolute inset-0 block overflow-hidden"
              aria-label={`Agrandir : ${photo.title ?? "photo"}`}
            >
              <Img
                photo={photo}
                sizes="(min-width: 768px) 60vw, 100vw"
                className="transition-transform duration-[1200ms] ease-[var(--ease-brand)] group-hover:scale-[1.04]"
              />
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-4 md:p-6">
                <span className="display text-2xl md:text-3xl">{photo.title}</span>
                <span className="eyebrow text-paper/70">{String(i + 1).padStart(2, "0")}</span>
              </span>
            </button>
          </Reveal>
        ))}
      </ul>
      <Lightbox photos={photos} index={index} onIndexChange={setIndex} />
    </>
  );
}
