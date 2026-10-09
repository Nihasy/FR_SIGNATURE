import { mkdirSync } from "node:fs";
import sharp from "sharp";
import { FIXTURES, service, TAG } from "./helpers";

/** Génère des images de test et nettoie les restes d'une exécution précédente. */
export default async function globalSetup() {
  mkdirSync(FIXTURES, { recursive: true });
  const colors = ["#c0392b", "#2c3e50", "#16a085"];
  for (const [i, color] of colors.entries()) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="3600" height="2400"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" font-size="400" fill="#fff" text-anchor="middle" font-family="Arial">TEST ${i + 1}</text></svg>`;
    await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile(`${FIXTURES}/test-${i + 1}.jpg`);
  }
  // Portrait (rotation EXIF : l'image stockée est paysage, orientation 6 => portrait)
  await sharp({ create: { width: 2400, height: 1600, channels: 3, background: "#8e44ad" } })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toFile(`${FIXTURES}/rotated.jpg`);
  await cleanup();
}

export async function cleanup() {
  const db = service();
  const { data: photos } = await db.from("photos").select("id,path,thumb_path,original_name,title").or(`original_name.like.test-%,original_name.like.rotated%,title.like.${TAG}%`);
  if (photos?.length) {
    await db.storage.from("photos").remove(photos.flatMap((p) => [p.path, p.thumb_path]));
    await db.from("photos").delete().in("id", photos.map((p) => p.id));
  }
  await db.from("albums").delete().like("title", `${TAG}%`);
  await db.from("messages").delete().like("name", `${TAG}%`);
  await db.from("categories").delete().like("name", `${TAG}%`);
  await db.from("settings").update({ instagram_url: null }).eq("id", 1);
}
