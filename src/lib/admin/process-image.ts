"use client";

import { LARGE_EDGE, THUMB_EDGE } from "@/lib/images";

export type ProcessedImage = {
  large: Blob;
  thumb: Blob;
  blur: string;
  width: number;
  height: number;
  ext: "webp" | "jpg";
  type: "image/webp" | "image/jpeg";
};

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export function checkFile(file: File): string | null {
  if (/\.(heic|heif)$/i.test(file.name) || file.type === "image/heic" || file.type === "image/heif") {
    return "Format HEIC non pris en charge : exportez la photo en JPEG.";
  }
  if (file.type && !ACCEPTED.includes(file.type)) return "Format non pris en charge (JPEG, PNG, WebP ou AVIF).";
  if (file.size > 60 * 1024 * 1024) return "Fichier trop lourd (60 Mo max).";
  return null;
}

function fit(w: number, h: number, edge: number) {
  const scale = Math.min(1, edge / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * scale)), h: Math.max(1, Math.round(h * scale)) };
}

function draw(source: CanvasImageSource, w: number, h: number) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponible");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, w, h);
  return canvas;
}

/** Réduit par paliers de moitié pour un rendu net (évite l'aliasing d'une réduction brutale). */
function resize(bitmap: ImageBitmap, edge: number) {
  const target = fit(bitmap.width, bitmap.height, edge);
  let src: CanvasImageSource = bitmap;
  let w = bitmap.width;
  let h = bitmap.height;
  while (w / 2 >= target.w && h / 2 >= target.h) {
    w = Math.round(w / 2);
    h = Math.round(h / 2);
    src = draw(src, w, h);
  }
  return draw(src, target.w, target.h);
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Encodage impossible"))), type, quality),
  );
}

/**
 * Prépare une photo dans le navigateur avant envoi :
 * grand format (2400 px, WebP), miniature (960 px) et aperçu flou (24 px).
 * L'orientation EXIF est appliquée ; les métadonnées (GPS…) sont supprimées.
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const largeCanvas = resize(bitmap, LARGE_EDGE);
    let type: ProcessedImage["type"] = "image/webp";
    let large = await toBlob(largeCanvas, type, 0.85);
    if (large.type !== "image/webp") {
      // Navigateur sans encodeur WebP : repli JPEG.
      type = "image/jpeg";
      large = await toBlob(largeCanvas, type, 0.86);
    }
    const thumb = await toBlob(resize(bitmap, THUMB_EDGE), type, 0.78);
    const tiny = draw(largeCanvas, ...(Object.values(fit(largeCanvas.width, largeCanvas.height, 24)) as [number, number]));
    const blur = tiny.toDataURL("image/jpeg", 0.5);
    return {
      large,
      thumb,
      blur,
      width: largeCanvas.width,
      height: largeCanvas.height,
      type,
      ext: type === "image/webp" ? "webp" : "jpg",
    };
  } finally {
    bitmap.close();
  }
}

/** « coucher-de-soleil.jpg » → « Coucher de soleil » ; les noms d'appareil (DSCF0412…) donnent un titre vide. */
export function titleFromFilename(name: string) {
  const base = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  if (!base || /^(dscf?|img|dsc|pxl|mvimg|photo|image|gopr|p)\s?\d+/i.test(base) || /^\d+$/.test(base)) return "";
  return base.charAt(0).toUpperCase() + base.slice(1);
}
