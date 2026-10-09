import type { MetadataRoute } from "next";
import { getAlbums } from "@/lib/data";
import { SITE_URL } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const albums = await getAlbums();
  const pages = ["", "/portfolio", "/series", "/prestations", "/a-propos", "/contact", "/mentions-legales"];
  return [
    ...pages.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...albums.map((a) => ({ url: `${SITE_URL}/series/${a.slug}`, lastModified: a.updated_at, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
