"use client";

import { Img } from "./Img";
import type { Photo } from "@/lib/types";

/**
 * Grille « justifiée » façon planche contact : chaque ligne remplit la largeur
 * en respectant le ratio des photos, sans recadrage. 100 % CSS (flex-grow).
 */
export function JustifiedGrid({
  photos,
  onOpen,
  rowHeight = "clamp(160px, 26vw, 340px)",
}: {
  photos: Photo[];
  onOpen: (index: number) => void;
  rowHeight?: string;
}) {
  return (
    <ul className="flex flex-wrap gap-1.5 sm:gap-2" style={{ ["--row" as string]: rowHeight }}>
      {photos.map((photo, i) => {
        const ratio = photo.width / photo.height;
        return (
          <li
            key={photo.id}
            className="relative"
            style={{ flexGrow: ratio * 100, width: `calc(${ratio} * var(--row))` }}
          >
            <button
              type="button"
              onClick={() => onOpen(i)}
              className="group relative block w-full overflow-hidden"
              aria-label={`Agrandir : ${photo.title ?? "photo"}`}
            >
              <span className="block" style={{ paddingBottom: `${(photo.height / photo.width) * 100}%` }} />
              <Img
                photo={photo}
                sizes={`(min-width: 1024px) ${Math.round(ratio * 340)}px, ${Math.round(ratio * 220)}px`}
                className="transition-transform duration-700 ease-[var(--ease-brand)] group-hover:scale-[1.03]"
              />
              <span className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="display text-lg text-paper">{photo.title}</span>
              </span>
            </button>
          </li>
        );
      })}
      <li aria-hidden="true" style={{ flexGrow: 1e9 }} />
    </ul>
  );
}
