// Importe la sélection de photos du dossier de présentation dans Supabase.
// Usage : node --env-file=.env.local scripts/seed.mjs [dossier-source]
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const SRC = process.argv[2] ?? "_ref/img";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis");
const db = createClient(url, key, { auth: { persistSession: false } });

const manifest = JSON.parse(await readFile("scripts/seed-manifest.json", "utf8"));

const albumIds = {};
for (const a of manifest.albums) {
  const { data, error } = await db
    .from("albums")
    .upsert({ ...a, published: true }, { onConflict: "slug" })
    .select("id,slug")
    .single();
  if (error) throw error;
  albumIds[a.slug] = data.id;
}
console.log(`${Object.keys(albumIds).length} séries`);

const order = {};
let total = 0;
const start = Date.now();
for (const [idx, [file, category, albumSlug, title, flags]] of manifest.photos.entries()) {
  const input = await readFile(path.join(SRC, `${file}.jpeg`));
  const base = sharp(input).rotate();
  const large = await base.clone().resize(2400, 2400, { fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer({ resolveWithObject: true });
  const thumb = await base.clone().resize(960, 960, { fit: "inside", withoutEnlargement: true }).webp({ quality: 76 }).toBuffer();
  const tiny = await base.clone().resize(24, 24, { fit: "inside" }).webp({ quality: 40 }).toBuffer();

  const dir = `seed/${file}`;
  for (const [name, buf] of [["large.webp", large.data], ["thumb.webp", thumb]]) {
    const { error } = await db.storage.from("photos").upload(`${dir}/${name}`, buf, {
      contentType: "image/webp",
      upsert: true,
      cacheControl: "31536000",
    });
    if (error) throw error;
  }

  const groupKey = albumSlug ?? `cat:${category}`;
  order[groupKey] = (order[groupKey] ?? 0) + 1;
  const row = {
    path: `${dir}/large.webp`,
    thumb_path: `${dir}/thumb.webp`,
    width: large.info.width,
    height: large.info.height,
    bytes: large.data.length + thumb.length,
    blur: `data:image/webp;base64,${tiny.toString("base64")}`,
    title,
    alt: `${title} — photographie ${category === "automobile" ? "automobile" : category === "corporate" ? "corporate" : "moto"} par FR Signature Auto`,
    category,
    album_id: albumSlug ? albumIds[albumSlug] : null,
    featured: flags.includes("featured"),
    hero: flags.includes("hero"),
    published: true,
    sort_order: order[groupKey],
    original_name: `${file}.jpeg`,
    // L'ordre du manifeste devient l'ordre « plus récent d'abord » du portfolio.
    created_at: new Date(start - idx * 60_000).toISOString(),
  };
  const { error } = await db.from("photos").upsert(row, { onConflict: "path" });
  if (error) throw error;
  total += row.bytes;
  process.stdout.write(".");
}
console.log(`\n${manifest.photos.length} photos, ${(total / 1024 / 1024).toFixed(1)} Mo`);

// Couverture = première photo de chaque série
for (const [slug, id] of Object.entries(albumIds)) {
  const { data } = await db.from("photos").select("id").eq("album_id", id).order("sort_order").limit(1).maybeSingle();
  if (data) await db.from("albums").update({ cover_photo_id: data.id }).eq("id", id);
  void slug;
}
console.log("Couvertures définies.");
