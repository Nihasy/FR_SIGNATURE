"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdmin } from "@/components/admin/AdminContext";
import { PhotoEditor } from "@/components/admin/PhotoEditor";
import { Uploader } from "@/components/admin/Uploader";
import { deletePhotos, PHOTO_COLUMNS } from "@/lib/admin/api";
import { photoSrc } from "@/lib/images";
import type { Album, Category, Photo } from "@/lib/types";

type Status = "toutes" | "publiees" | "brouillons" | "selection" | "diaporama" | "sans-serie";

export default function PhotosAdminPage() {
  const { supabase, publish, toast } = useAdmin();
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [album, setAlbum] = useState("");
  const [status, setStatus] = useState<Status>("toutes");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Photo | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const load = useCallback(async () => {
    const [p, c, a] = await Promise.all([
      supabase.from("photos").select(PHOTO_COLUMNS).order("created_at", { ascending: false }).limit(5000),
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("albums").select("*").order("sort_order"),
    ]);
    if (p.error) toast(p.error.message, "error");
    setPhotos((p.data as Photo[]) ?? []);
    setCategories(c.data ?? []);
    setAlbums(a.data ?? []);
  }, [supabase, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial des données
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!photos) return [];
    const needle = q.trim().toLowerCase();
    return photos.filter((p) => {
      if (cat && (cat === "_none" ? p.category : p.category !== cat)) return false;
      if (album && p.album_id !== album) return false;
      if (status === "publiees" && !p.published) return false;
      if (status === "brouillons" && p.published) return false;
      if (status === "selection" && !p.featured) return false;
      if (status === "diaporama" && !p.hero) return false;
      if (status === "sans-serie" && p.album_id) return false;
      if (needle && !`${p.title ?? ""} ${p.alt ?? ""} ${p.original_name ?? ""}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [photos, q, cat, album, status]);

  const albumName = useMemo(() => new Map(albums.map((a) => [a.id, a.title])), [albums]);
  const catName = useMemo(() => new Map(categories.map((c) => [c.slug, c.name])), [categories]);
  const selectedPhotos = filtered.filter((p) => selected.has(p.id));

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function bulkUpdate(patch: Partial<Photo>, label: string) {
    if (!selectedPhotos.length) return;
    setBusy(true);
    const ids = selectedPhotos.map((p) => p.id);
    const { error } = await supabase.from("photos").update(patch).in("id", ids);
    setBusy(false);
    if (error) return toast(error.message, "error");
    setPhotos((list) => list?.map((p) => (selected.has(p.id) ? { ...p, ...patch } : p)) ?? null);
    await publish();
    toast(`${ids.length} photo${ids.length > 1 ? "s" : ""} : ${label}.`);
  }

  async function bulkDelete() {
    setBusy(true);
    try {
      await deletePhotos(supabase, selectedPhotos);
      const ids = new Set(selectedPhotos.map((p) => p.id));
      setPhotos((list) => list?.filter((p) => !ids.has(p.id)) ?? null);
      setSelected(new Set());
      await publish();
      toast(`${ids.size} photo${ids.size > 1 ? "s" : ""} supprimée${ids.size > 1 ? "s" : ""}.`);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
    }
    setBusy(false);
    setConfirmBulkDelete(false);
  }

  const ctl = "border border-line bg-ink px-3 py-2 text-sm focus:border-red focus:outline-none";

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-paper/50">Bibliothèque</p>
          <h1 className="display mt-2 text-5xl">Photos</h1>
        </div>
        <button type="button" className="btn btn-red" onClick={() => setShowUpload((v) => !v)} aria-expanded={showUpload}>
          {showUpload ? "Fermer l'import" : "+ Importer"}
        </button>
      </div>

      {showUpload && (
        <div className="mt-6">
          <Uploader
            categories={categories}
            albums={albums}
            onUploaded={(added) => setPhotos((list) => [...added.reverse(), ...(list ?? [])])}
          />
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un titre…" aria-label="Rechercher" className={`${ctl} min-w-48 flex-1`} />
        <select value={status} onChange={(e) => setStatus(e.target.value as Status)} aria-label="Statut" className={ctl}>
          <option value="toutes">Toutes</option>
          <option value="publiees">Publiées</option>
          <option value="brouillons">Brouillons</option>
          <option value="selection">Sélection accueil</option>
          <option value="diaporama">Diaporama accueil</option>
          <option value="sans-serie">Sans série</option>
        </select>
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Discipline" className={ctl}>
          <option value="">Toutes disciplines</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
          <option value="_none">Sans discipline</option>
        </select>
        <select value={album} onChange={(e) => setAlbum(e.target.value)} aria-label="Série" className={ctl}>
          <option value="">Toutes séries</option>
          {albums.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
      </div>

      {/* Barre d'actions groupées */}
      <div className="sticky top-0 z-20 -mx-4 mt-4 flex min-h-14 flex-wrap items-center gap-2 border-y border-line bg-ink/95 px-4 py-2 backdrop-blur md:-mx-8 md:px-8">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            aria-label="Tout sélectionner"
            checked={filtered.length > 0 && selectedPhotos.length === filtered.length}
            onChange={(e) => setSelected(e.target.checked ? new Set(filtered.map((p) => p.id)) : new Set())}
            className="h-4 w-4 accent-[var(--red)]"
          />
          {selectedPhotos.length ? `${selectedPhotos.length} sélectionnée(s)` : `${filtered.length} photo(s)`}
        </label>
        {selectedPhotos.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm" aria-label="Actions groupées">
            <button disabled={busy} className="border border-line px-3 py-1.5 hover:bg-ink-3" onClick={() => bulkUpdate({ published: true }, "publiées")}>
              Publier
            </button>
            <button disabled={busy} className="border border-line px-3 py-1.5 hover:bg-ink-3" onClick={() => bulkUpdate({ published: false }, "passées en brouillon")}>
              Dépublier
            </button>
            <button disabled={busy} className="border border-line px-3 py-1.5 hover:bg-ink-3" onClick={() => bulkUpdate({ featured: true }, "ajoutées à la sélection")}>
              ★ Sélection
            </button>
            <button disabled={busy} className="border border-line px-3 py-1.5 hover:bg-ink-3" onClick={() => bulkUpdate({ featured: false }, "retirées de la sélection")}>
              ☆ Retirer
            </button>
            <select
              disabled={busy}
              value=""
              aria-label="Changer la discipline"
              className={ctl}
              onChange={(e) => e.target.value && bulkUpdate({ category: e.target.value === "_none" ? null : e.target.value }, "discipline modifiée")}
            >
              <option value="">Discipline…</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
              <option value="_none">Aucune</option>
            </select>
            <select
              disabled={busy}
              value=""
              aria-label="Déplacer vers une série"
              className={ctl}
              onChange={(e) => e.target.value && bulkUpdate({ album_id: e.target.value === "_none" ? null : e.target.value }, "série modifiée")}
            >
              <option value="">Série…</option>
              {albums.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
              <option value="_none">Retirer de la série</option>
            </select>
            {confirmBulkDelete ? (
              <span className="flex items-center gap-2">
                Supprimer {selectedPhotos.length} photo(s) ?
                <button disabled={busy} className="bg-red px-3 py-1.5 text-white" onClick={bulkDelete}>
                  Confirmer
                </button>
                <button className="px-2 text-paper/60" onClick={() => setConfirmBulkDelete(false)}>
                  Annuler
                </button>
              </span>
            ) : (
              <button disabled={busy} className="px-3 py-1.5 text-red hover:underline" onClick={() => setConfirmBulkDelete(true)}>
                Supprimer
              </button>
            )}
          </div>
        )}
      </div>

      {photos === null ? (
        <p className="eyebrow mt-10 animate-pulse text-paper/50">Chargement…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-paper/50">Aucune photo ne correspond à ces filtres.</p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" data-testid="photo-grid">
          {filtered.map((p) => {
            const isSel = selected.has(p.id);
            return (
              <li key={p.id} className={`group relative bg-ink-2 ${isSel ? "outline outline-2 outline-red" : ""}`} data-testid="photo-card">
                <button type="button" onClick={() => setEditing(p)} className="block w-full text-left" aria-label={`Modifier ${p.title ?? p.original_name ?? "la photo"}`}>
                  <span className="relative block aspect-square overflow-hidden bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoSrc(p).thumb} alt="" loading="lazy" className={`h-full w-full object-cover transition-opacity ${p.published ? "" : "opacity-40"}`} />
                    <span className="absolute bottom-1 left-1 flex gap-1 text-[10px] font-bold uppercase tracking-wider">
                      {!p.published && <span className="bg-paper px-1.5 py-0.5 text-ink">Brouillon</span>}
                      {p.featured && <span className="bg-red px-1.5 py-0.5 text-white">★</span>}
                      {p.hero && <span className="bg-ink px-1.5 py-0.5 text-paper">Diapo</span>}
                    </span>
                  </span>
                  <span className="block p-2">
                    <span className="block truncate text-sm">{p.title || <em className="text-paper/40">Sans titre</em>}</span>
                    <span className="block truncate text-xs text-paper/40">
                      {[p.category && catName.get(p.category), p.album_id && albumName.get(p.album_id)].filter(Boolean).join(" · ") || "—"}
                    </span>
                  </span>
                </button>
                <label className="absolute left-1 top-1 flex h-8 w-8 cursor-pointer items-center justify-center bg-black/60">
                  <input type="checkbox" checked={isSel} onChange={() => toggle(p.id)} aria-label="Sélectionner" className="h-4 w-4 accent-[var(--red)]" />
                </label>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <PhotoEditor
          key={editing.id}
          photo={editing}
          categories={categories}
          albums={albums}
          onClose={() => setEditing(null)}
          onSaved={(p) => {
            setPhotos((list) => list?.map((x) => (x.id === p.id ? p : x)) ?? null);
            setEditing(null);
            load();
          }}
          onDeleted={(id) => {
            setPhotos((list) => list?.filter((x) => x.id !== id) ?? null);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
