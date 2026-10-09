import Link from "next/link";
import { Img } from "./Img";
import type { AlbumWithCover } from "@/lib/types";

export function AlbumCard({
  album,
  index,
  className = "",
  sizes = "(min-width: 1024px) 40vw, 85vw",
}: {
  album: AlbumWithCover;
  index: number;
  className?: string;
  sizes?: string;
}) {
  return (
    <Link href={`/series/${album.slug}`} className={`group block ${className}`}>
      <div className="relative aspect-[4/5] overflow-hidden bg-ink-3">
        {album.cover && (
          <Img
            photo={album.cover}
            sizes={sizes}
            className="transition-transform duration-[1200ms] ease-[var(--ease-brand)] group-hover:scale-[1.05]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-2 md:left-6 md:top-6">
          <span className="eyebrow bg-red px-2 py-1 text-white">{String(index + 1).padStart(2, "0")}</span>
          <span className="eyebrow text-paper/80">{album.photo_count} photos</span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4 md:p-6">
          {album.subtitle && <p className="eyebrow mb-3 text-paper/70">{album.subtitle}</p>}
          <h3 className="display text-4xl md:text-5xl">{album.title}</h3>
          <p className="eyebrow mt-4 flex items-center gap-2 text-paper/0 transition-colors duration-500 group-hover:text-paper">
            Découvrir la série <span aria-hidden="true">→</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
