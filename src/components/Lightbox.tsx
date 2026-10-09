"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { photoAlt, photoSrc } from "@/lib/images";
import type { Photo } from "@/lib/types";

type Props = {
  photos: Photo[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
  caption?: (photo: Photo) => string | null;
};

/** Visionneuse plein écran : clavier (← → Échap), glisser au doigt, préchargement des voisines. */
export function Lightbox({ photos, index, onIndexChange, caption }: Props) {
  const open = index !== null && photos[index] !== undefined;
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  const go = useCallback(
    (delta: number) => {
      if (index === null || !photos.length) return;
      onIndexChange((index + delta + photos.length) % photos.length);
    },
    [index, photos.length, onIndexChange],
  );
  const close = useCallback(() => onIndexChange(null), [onIndexChange]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      previous?.focus?.();
    };
  }, [open, go, close]);

  // Précharge les images voisines
  useEffect(() => {
    if (index === null || photos.length < 2) return;
    for (const d of [1, -1]) {
      const p = photos[(index + d + photos.length) % photos.length];
      const img = new Image();
      img.src = photoSrc(p).large;
    }
  }, [index, photos]);

  if (!open) return null;
  const photo = photos[index];
  const { large } = photoSrc(photo);
  const text = caption?.(photo) ?? photo.title;
  const loaded = loadedSrc === large;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visionneuse photo"
      className="fixed inset-0 z-[60] flex flex-col bg-black/95"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-6">
        <p className="eyebrow text-paper/60" aria-live="polite">
          <span className="text-paper">{String(index + 1).padStart(2, "0")}</span> / {String(photos.length).padStart(2, "0")}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          className="eyebrow flex h-11 items-center gap-3 px-2 text-paper/80 hover:text-paper"
          aria-label="Fermer la visionneuse"
        >
          Fermer
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 2l14 14M16 2L2 16" />
          </svg>
        </button>
      </div>

      <div className="relative min-h-0 flex-1" onClick={(e) => e.target === e.currentTarget && close()}>
        <div
          className="pointer-events-none absolute inset-0 m-auto bg-cover bg-center opacity-40 blur-2xl"
          style={photo.blur ? { backgroundImage: `url(${photo.blur})` } : undefined}
          aria-hidden="true"
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- image déjà optimisée */}
        <img
          key={photo.id}
          src={large}
          alt={photoAlt(photo)}
          width={photo.width}
          height={photo.height}
          onLoad={() => setLoadedSrc(large)}
          className={`img-fade absolute inset-0 m-auto max-h-full max-w-full object-contain px-2 sm:px-20 ${loaded ? "opacity-100" : "opacity-0"}`}
          onClick={(e) => e.stopPropagation()}
        />
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Photo précédente"
              className="absolute left-0 top-1/2 hidden h-24 w-16 -translate-y-1/2 items-center justify-center text-paper/70 hover:text-paper sm:flex"
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M18 4L8 14l10 10" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Photo suivante"
              className="absolute right-0 top-1/2 hidden h-24 w-16 -translate-y-1/2 items-center justify-center text-paper/70 hover:text-paper sm:flex"
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M10 4l10 10-10 10" />
              </svg>
            </button>
          </>
        )}
      </div>

      <div className="flex min-h-16 shrink-0 items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <p className="display text-xl sm:text-2xl">{text}</p>
        {photos.length > 1 && (
          <div className="flex gap-2 sm:hidden">
            <button type="button" onClick={() => go(-1)} aria-label="Photo précédente" className="h-11 w-11 border border-line">
              ‹
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Photo suivante" className="h-11 w-11 border border-line">
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
