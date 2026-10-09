"use client";

import { useState } from "react";
import { JustifiedGrid } from "./JustifiedGrid";
import { Lightbox } from "./Lightbox";
import type { Photo } from "@/lib/types";

export function AlbumGallery({ photos, albumTitle }: { photos: Photo[]; albumTitle: string }) {
  const [index, setIndex] = useState<number | null>(null);
  return (
    <>
      <JustifiedGrid photos={photos} onOpen={setIndex} rowHeight="clamp(180px, 30vw, 420px)" />
      <Lightbox
        photos={photos}
        index={index}
        onIndexChange={setIndex}
        caption={(p) => [p.title, albumTitle].filter(Boolean).join(" — ")}
      />
    </>
  );
}
