"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Img } from "./Img";
import type { Photo } from "@/lib/types";

const DURATION = 6500;

export function HeroSlideshow({ photos }: { photos: Photo[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (photos.length < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setTimeout(() => setCurrent((c) => (c + 1) % photos.length), DURATION);
    return () => window.clearTimeout(t);
  }, [current, paused, photos.length]);

  const photo = photos[current];

  return (
    <section
      className="relative h-[100svh] min-h-[560px] w-full overflow-hidden bg-ink"
      aria-roledescription="carrousel"
      aria-label="Photographies à la une"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {photos.map((p, i) => (
        <div
          key={p.id}
          className={`absolute inset-0 transition-opacity duration-[1400ms] ease-[var(--ease-brand)] ${
            i === current ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={i !== current}
        >
          {/* On ne monte que l'image courante et ses voisines pour limiter le poids initial */}
          {Math.abs(i - current) <= 1 || (current === photos.length - 1 && i === 0) ? (
            <div className={`absolute inset-0 ${i === current ? "kenburns" : ""}`}>
              <Img photo={p} variant="large" sizes="100vw" priority={i === 0} />
            </div>
          ) : null}
        </div>
      ))}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40" />

      <div className="container-x relative flex h-full flex-col justify-end pb-10 md:pb-16">
        <p className="eyebrow mb-6 flex items-center gap-3 text-paper/80">
          <span className="h-px w-10 bg-red" />
          Photographe Auto-Moto · Antananarivo
        </p>
        <h1 className="display max-w-5xl text-[15vw] sm:text-[11vw] lg:text-[8.5vw]">
          La passion
          <br />
          racontée <span className="text-red">en images.</span>
        </h1>
        <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-wrap gap-3">
            <Link href="/portfolio" className="btn btn-red">
              Voir le portfolio
              <span aria-hidden="true">→</span>
            </Link>
            <Link href="/contact" className="btn btn-ghost">
              Collaborer
            </Link>
          </div>
          {photos.length > 1 && (
            <div className="flex items-center gap-5">
              <p className="eyebrow text-paper/70" aria-live="polite">
                {photo?.title}
              </p>
              <div className="flex gap-1.5">
                {photos.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setCurrent(i)}
                    aria-label={`Afficher la photo ${i + 1}`}
                    aria-current={i === current}
                    className="group flex h-8 items-center"
                  >
                    <span className={`block h-0.5 transition-all duration-500 ${i === current ? "w-10 bg-red" : "w-5 bg-paper/40 group-hover:bg-paper"}`} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
