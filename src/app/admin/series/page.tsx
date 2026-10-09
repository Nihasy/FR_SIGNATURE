"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/AdminContext";
import { slugify } from "@/lib/admin/api";
import { storageUrl } from "@/lib/images";
import type { Album, Category } from "@/lib/types";

type Row = Album & { photos: { count: number }[]; cover: { thumb_path: string } | null };

export default function SeriesAdminPage() {
  const { supabase, toast, publish } = useAdmin();
  const router = useRouter();
  const [albums, setAlbums] = useState<Row[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const [a, c] = await Promise.all([
      supabase.from("albums").select("*, photos!photos_album_id_fkey(count), cover:photos!albums_cover_fk(thumb_path)").order("sort_order").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order"),
    ]);
    if (a.error) toast(a.error.message, "error");
    setAlbums((a.data as Row[]) ?? []);
    setCategories(c.data ?? []);
  }, [supabase, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial
    load();
  }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const slug = slugify(title);
    if (!slug) return toast("Titre invalide.", "error");
    setCreating(true);
    const maxOrder = Math.max(0, ...(albums ?? []).map((a) => a.sort_order));
    const { data, error } = await supabase
      .from("albums")
      .insert({ title: title.trim(), slug, category: category || null, published: false, sort_order: maxOrder + 1 })
      .select("id")
      .single();
    setCreating(false);
    if (error) {
      return toast(error.code === "23505" ? "Une série porte déjà ce nom (adresse identique)." : error.message, "error");
    }
    await publish();
    router.push(`/admin/series/edit?id=${data.id}`);
  }

  async function move(id: string, dir: -1 | 1) {
    if (!albums) return;
    const i = albums.findIndex((a) => a.id === id);
    const j = i + dir;
    if (j < 0 || j >= albums.length) return;
    const next = [...albums];
    [next[i], next[j]] = [next[j], next[i]];
    setAlbums(next);
    const results = await Promise.all(next.map((a, k) => supabase.from("albums").update({ sort_order: k + 1 }).eq("id", a.id)));
    if (results.some((r) => r.error)) toast("Ordre non enregistré.", "error");
    else await publish();
  }

  return (
    <div className="p-4 md:p-8">
      <p className="eyebrow text-paper/50">Reportages</p>
      <h1 className="display mt-2 text-5xl">Séries</h1>

      <form onSubmit={create} className="mt-8 flex flex-wrap gap-2 border border-line bg-ink-2 p-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={120}
          placeholder="Titre de la nouvelle série (ex. : Rallye de Tana 2026)"
          aria-label="Titre de la nouvelle série"
          className="min-w-64 flex-1 border border-line bg-ink px-3 py-2 text-sm focus:border-red focus:outline-none"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Discipline" className="border border-line bg-ink px-3 py-2 text-sm">
          <option value="">Discipline…</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" disabled={creating} className="btn btn-red disabled:opacity-60">
          Créer la série
        </button>
      </form>

      {albums === null ? (
        <p className="eyebrow mt-10 animate-pulse text-paper/50">Chargement…</p>
      ) : albums.length === 0 ? (
        <p className="mt-10 text-paper/50">Aucune série pour le moment.</p>
      ) : (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {albums.map((a, i) => (
            <li key={a.id} className="flex items-center gap-4 py-3">
              <div className="flex flex-col">
                <button type="button" onClick={() => move(a.id, -1)} disabled={i === 0} aria-label={`Monter ${a.title}`} className="px-2 text-paper/60 hover:text-paper disabled:opacity-20">
                  ▲
                </button>
                <button type="button" onClick={() => move(a.id, 1)} disabled={i === albums.length - 1} aria-label={`Descendre ${a.title}`} className="px-2 text-paper/60 hover:text-paper disabled:opacity-20">
                  ▼
                </button>
              </div>
              <span className="h-16 w-24 shrink-0 overflow-hidden bg-ink-3">
                {a.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={storageUrl(a.cover.thumb_path)} alt="" className="h-full w-full object-cover" />
                )}
              </span>
              <Link href={`/admin/series/edit?id=${a.id}`} className="min-w-0 flex-1">
                <span className="display block truncate text-2xl hover:text-red">{a.title}</span>
                <span className="block text-xs text-paper/50">
                  {a.photos?.[0]?.count ?? 0} photo(s) · /series/{a.slug}
                </span>
              </Link>
              <span className={`shrink-0 px-2 py-1 text-xs font-bold uppercase tracking-wider ${a.published ? "bg-green-900/60 text-green-300" : "bg-paper/10 text-paper/60"}`}>
                {a.published ? "En ligne" : "Brouillon"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
