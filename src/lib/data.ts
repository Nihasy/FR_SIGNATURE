import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { publicClient } from "./supabase/public";
import type { Album, AlbumWithCover, Category, Photo, Settings } from "./types";

/**
 * Lectures publiques, mises en cache et invalidées à chaque modification
 * faite depuis le back-office (tag « content »).
 */
export const CONTENT_TAG = "content";

const PHOTO_COLUMNS =
  "id,path,thumb_path,width,height,bytes,blur,title,alt,category,album_id,featured,hero,published,sort_order,original_name,created_at";

function fail(scope: string, error: { message: string } | null): never {
  throw new Error(`[supabase] ${scope} : ${error?.message ?? "erreur inconnue"}`);
}

export async function getSettings(): Promise<Settings> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("hours");
  const { data, error } = await publicClient()
    .from("settings")
    .select("email,phone,whatsapp,instagram_url,facebook_url,linkedin_url,location,availability")
    .eq("id", 1)
    .maybeSingle();
  if (error) fail("settings", error);
  return (
    data ?? {
      email: null,
      phone: null,
      whatsapp: null,
      instagram_url: null,
      facebook_url: null,
      linkedin_url: null,
      location: null,
      availability: null,
    }
  );
}

export async function getCategories(): Promise<(Category & { photo_count: number })[]> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("hours");
  const supabase = publicClient();
  const [{ data: cats, error }, { data: photos, error: e2 }] = await Promise.all([
    supabase.from("categories").select("slug,name,description,sort_order").order("sort_order"),
    supabase.from("photos").select("category").eq("published", true),
  ]);
  if (error) fail("categories", error);
  if (e2) fail("categories/photos", e2);
  const counts = new Map<string, number>();
  for (const p of photos ?? []) if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  return (cats ?? []).map((c) => ({ ...c, photo_count: counts.get(c.slug) ?? 0 }));
}

/** Toutes les photos publiées, les plus récentes d'abord (l'ordre manuel s'applique dans les séries). */
export async function getPublishedPhotos(): Promise<Photo[]> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("hours");
  const { data, error } = await publicClient()
    .from("photos")
    .select(PHOTO_COLUMNS)
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(2000);
  if (error) fail("photos", error);
  return data ?? [];
}

export async function getHeroPhotos(): Promise<Photo[]> {
  const photos = await getPublishedPhotos();
  const hero = photos.filter((p) => p.hero);
  if (hero.length) return hero.slice(0, 8);
  // Repli : les photos paysage les plus récentes.
  return photos.filter((p) => p.width >= p.height).slice(0, 5);
}

export async function getFeaturedPhotos(limit = 12): Promise<Photo[]> {
  const photos = await getPublishedPhotos();
  const featured = photos.filter((p) => p.featured);
  return (featured.length ? featured : photos).slice(0, limit);
}

export async function getAlbums(): Promise<AlbumWithCover[]> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("hours");
  const { data, error } = await publicClient()
    .from("albums")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) fail("albums", error);
  const photos = await getPublishedPhotos();
  return (data ?? []).map((album: Album) => withCover(album, photos));
}

export async function getAlbum(
  slug: string,
): Promise<{ album: AlbumWithCover; photos: Photo[] } | null> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("hours");
  const { data, error } = await publicClient()
    .from("albums")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error) fail("album", error);
  if (!data) return null;
  const all = await getPublishedPhotos();
  const photos = all
    .filter((p) => p.album_id === data.id)
    .sort((a, b) => a.sort_order - b.sort_order || b.created_at.localeCompare(a.created_at));
  return { album: withCover(data, all), photos };
}

function withCover(album: Album, photos: Photo[]): AlbumWithCover {
  const own = photos.filter((p) => p.album_id === album.id);
  const cover =
    (album.cover_photo_id && photos.find((p) => p.id === album.cover_photo_id)) ||
    [...own].sort((a, b) => a.sort_order - b.sort_order)[0] ||
    null;
  return { ...album, cover, photo_count: own.length };
}
