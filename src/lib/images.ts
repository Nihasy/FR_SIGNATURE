import { BUCKET, SUPABASE_URL } from "./env";
import type { Photo } from "./types";

export function storageUrl(path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

export function photoSrc(photo: Pick<Photo, "path" | "thumb_path">) {
  return { large: storageUrl(photo.path), thumb: storageUrl(photo.thumb_path) };
}

export function photoAlt(photo: Pick<Photo, "alt" | "title">) {
  return photo.alt || photo.title || "Photographie FR Signature Auto";
}

/** Largeur des miniatures générées à l'import (côté le plus long). */
export const THUMB_EDGE = 960;
/** Côté le plus long des images « grand format ». */
export const LARGE_EDGE = 2400;
