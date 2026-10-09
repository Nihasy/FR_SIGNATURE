"use client";

import { useState } from "react";
import { photoAlt, photoSrc } from "@/lib/images";
import type { Photo } from "@/lib/types";

type Props = {
  photo: Photo;
  /** « thumb » pour les grilles, « large » pour les visuels plein écran. */
  variant?: "thumb" | "large";
  sizes?: string;
  className?: string;
  priority?: boolean;
  fill?: boolean;
};

/** Image Supabase pré-dimensionnée, avec aperçu flou pendant le chargement. */
export function Img({ photo, variant = "thumb", sizes, className = "", priority, fill = true }: Props) {
  const [loaded, setLoaded] = useState(false);
  const { thumb, large } = photoSrc(photo);
  const srcSet = `${thumb} 960w, ${large} ${photo.width}w`;
  return (
    <span
      className={`block overflow-hidden bg-ink-3 ${fill ? "absolute inset-0" : "relative"} ${className}`}
      style={photo.blur ? { backgroundImage: `url(${photo.blur})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- images déjà optimisées à l'import (WebP pré-dimensionné) */}
      <img
        ref={(el) => {
          if (el?.complete && el.naturalWidth) setLoaded(true);
        }}
        src={variant === "large" ? large : thumb}
        srcSet={srcSet}
        sizes={sizes ?? (variant === "large" ? "100vw" : "(min-width: 1024px) 33vw, 100vw")}
        width={photo.width}
        height={photo.height}
        alt={photoAlt(photo)}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`img-fade h-full w-full object-cover ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </span>
  );
}
