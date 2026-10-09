"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { BUCKET } from "@/lib/env";
import type { Photo } from "@/lib/types";
import { processImage, titleFromFilename } from "./process-image";

export const PHOTO_COLUMNS =
  "id,path,thumb_path,width,height,bytes,blur,title,alt,category,album_id,featured,hero,published,sort_order,original_name,created_at";

export type UploadOptions = {
  category: string | null;
  albumId: string | null;
  published: boolean;
};

export type UploadStep = "préparation" | "envoi" | "enregistrement";

/** Prépare, envoie et enregistre une photo. Annule proprement les fichiers si l'enregistrement échoue. */
export async function uploadPhoto(
  supabase: SupabaseClient,
  file: File,
  opts: UploadOptions,
  onStep?: (step: UploadStep) => void,
): Promise<Photo> {
  onStep?.("préparation");
  const img = await processImage(file);
  const dir = `uploads/${crypto.randomUUID()}`;
  const path = `${dir}/large.${img.ext}`;
  const thumbPath = `${dir}/thumb.${img.ext}`;

  onStep?.("envoi");
  const storage = supabase.storage.from(BUCKET);
  const options = { contentType: img.type, cacheControl: "31536000", upsert: false };
  const [a, b] = await Promise.all([storage.upload(path, img.large, options), storage.upload(thumbPath, img.thumb, options)]);
  if (a.error || b.error) {
    await storage.remove([path, thumbPath]);
    throw new Error(`Envoi impossible : ${(a.error ?? b.error)!.message}`);
  }

  onStep?.("enregistrement");
  let sortOrder = 0;
  if (opts.albumId) {
    const { data } = await supabase
      .from("photos")
      .select("sort_order")
      .eq("album_id", opts.albumId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    sortOrder = (data?.sort_order ?? 0) + 1;
  }
  const title = titleFromFilename(file.name);
  const { data, error } = await supabase
    .from("photos")
    .insert({
      path,
      thumb_path: thumbPath,
      width: img.width,
      height: img.height,
      bytes: img.large.size + img.thumb.size,
      blur: img.blur,
      title: title || null,
      category: opts.category,
      album_id: opts.albumId,
      published: opts.published,
      sort_order: sortOrder,
      original_name: file.name.slice(0, 255),
    })
    .select(PHOTO_COLUMNS)
    .single();
  if (error) {
    await storage.remove([path, thumbPath]);
    throw new Error(`Enregistrement impossible : ${error.message}`);
  }
  return data as Photo;
}

/** Supprime les photos (base puis fichiers). */
export async function deletePhotos(supabase: SupabaseClient, photos: Pick<Photo, "id" | "path" | "thumb_path">[]) {
  if (!photos.length) return;
  const { error } = await supabase
    .from("photos")
    .delete()
    .in(
      "id",
      photos.map((p) => p.id),
    );
  if (error) throw new Error(error.message);
  const { error: e2 } = await supabase.storage.from(BUCKET).remove(photos.flatMap((p) => [p.path, p.thumb_path]));
  if (e2) throw new Error(`Photos supprimées, mais fichiers non effacés : ${e2.message}`);
}

/** Enregistre l'ordre d'une liste de photos (index → sort_order). */
export async function saveOrder(supabase: SupabaseClient, ids: string[]) {
  const results = await Promise.all(
    ids.map((id, i) => supabase.from("photos").update({ sort_order: i + 1 }).eq("id", id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
}

/** Exécute des tâches avec un parallélisme limité. */
export async function runLimited<T>(items: T[], limit: number, task: (item: T, index: number) => Promise<void>) {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      await task(items[i], i);
    }
  });
  await Promise.all(workers);
}

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2).replace(".", ",")} Go`;
}
