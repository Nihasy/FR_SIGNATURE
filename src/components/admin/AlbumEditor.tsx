"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PHOTO_COLUMNS, saveOrder, slugify } from "@/lib/admin/api";
import { photoSrc } from "@/lib/images";
import type { Album, Category, Photo } from "@/lib/types";
import { useAdmin } from "./AdminContext";
import { PhotoEditor, Toggle } from "./PhotoEditor";
import { Uploader } from "./Uploader";

const fieldCls = "mt-1 w-full border border-line bg-ink px-3 py-2 text-sm focus:border-red focus:outline-none";

export function AlbumEditor() {
  const id = useSearchParams().get("id");
  const router = useRouter();
  const { supabase, publish, toast } = useAdmin();
  const [album, setAlbum] = useState<Album | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allAlbums, setAllAlbums] = useState<Album[]>([]);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Photo | null>(null);
  const [picker, setPicker] = useState<Photo[] | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    if (!id) return setNotFound(true);
    const [a, p, c, all] = await Promise.all([
      supabase.from("albums").select("*").eq("id", id).maybeSingle(),
      supabase.from("photos").select(PHOTO_COLUMNS).eq("album_id", id).order("sort_order").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("albums").select("*").order("sort_order"),
    ]);
    if (!a.data) return setNotFound(true);
    setAlbum(a.data);
    setPhotos((p.data as Photo[]) ?? []);
    setCategories(c.data ?? []);
    setAllAlbums(all.data ?? []);
  }, [id, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial
    load();
  }, [load]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  if (notFound) {
    return (
      <div className="p-8">
        <p>Série introuvable.</p>
        <Link href="/admin/series" className="mt-4 inline-block underline">
          Retour aux séries
        </Link>
      </div>
    );
  }
  if (!album) return <p className="eyebrow animate-pulse p-8 text-paper/50">Chargement…</p>;

  const set = <K extends keyof Album>(k: K, v: Album[K]) => setAlbum((a) => (a ? { ...a, [k]: v } : a));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!album) return;
    const slug = slugify(album.slug || album.title);
    if (!slug) return toast("Adresse (slug) invalide.", "error");
    setSaving(true);
    const { data, error } = await supabase
      .from("albums")
      .update({
        title: album.title.trim(),
        slug,
        subtitle: album.subtitle?.trim() || null,
        description: album.description?.trim() || null,
        category: album.category || null,
        location: album.location?.trim() || null,
        event_date: album.event_date || null,
        published: album.published,
      })
      .eq("id", album.id)
      .select("*")
      .single();
    setSaving(false);
    if (error) return toast(error.code === "23505" ? "Cette adresse est déjà utilisée par une autre série." : error.message, "error");
    setAlbum(data);
    await publish();
    toast("Série enregistrée.");
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = photos.findIndex((p) => p.id === active.id);
    const to = photos.findIndex((p) => p.id === over.id);
    const next = arrayMove(photos, from, to);
    setPhotos(next);
    try {
      await saveOrder(supabase, next.map((p) => p.id));
      await publish();
    } catch (err) {
      toast(`Ordre non enregistré : ${err instanceof Error ? err.message : err}`, "error");
    }
  }

  async function setCover(photoId: string) {
    if (!album) return;
    const { error } = await supabase.from("albums").update({ cover_photo_id: photoId }).eq("id", album.id);
    if (error) return toast(error.message, "error");
    set("cover_photo_id", photoId);
    await publish();
    toast("Couverture mise à jour.");
  }

  async function removeFromAlbum(photoId: string) {
    const { error } = await supabase.from("photos").update({ album_id: null }).eq("id", photoId);
    if (error) return toast(error.message, "error");
    setPhotos((list) => list.filter((p) => p.id !== photoId));
    if (album?.cover_photo_id === photoId) {
      await supabase.from("albums").update({ cover_photo_id: null }).eq("id", album.id);
      set("cover_photo_id", null);
    }
    await publish();
    toast("Photo retirée de la série (elle reste dans la bibliothèque).");
  }

  async function openPicker() {
    const { data, error } = await supabase
      .from("photos")
      .select(PHOTO_COLUMNS)
      .or(`album_id.is.null,album_id.neq.${album!.id}`)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) return toast(error.message, "error");
    setPicker((data as Photo[]) ?? []);
  }

  async function addPhotos(ids: string[]) {
    if (!ids.length || !album) return;
    const base = Math.max(0, ...photos.map((p) => p.sort_order));
    const results = await Promise.all(
      ids.map((pid, i) => supabase.from("photos").update({ album_id: album.id, sort_order: base + i + 1 }).eq("id", pid)),
    );
    if (results.some((r) => r.error)) toast("Certaines photos n'ont pas pu être ajoutées.", "error");
    setPicker(null);
    await load();
    await publish();
    toast(`${ids.length} photo(s) ajoutée(s) à la série.`);
  }

  async function deleteAlbum() {
    if (!album) return;
    const { error } = await supabase.from("albums").delete().eq("id", album.id);
    if (error) return toast(error.message, "error");
    await publish();
    toast("Série supprimée. Ses photos restent dans la bibliothèque.");
    router.replace("/admin/series");
  }

  return (
    <div className="p-4 md:p-8">
      <Link href="/admin/series" className="text-sm text-paper/60 hover:text-paper">
        ← Séries
      </Link>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-5xl">{album.title}</h1>
        {album.published && (
          <a href={`/series/${album.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm text-paper/70 hover:text-paper">
            Voir en ligne ↗
          </a>
        )}
      </div>

      <form onSubmit={save} className="mt-8 grid gap-4 border border-line bg-ink-2 p-4 md:grid-cols-2 md:p-6">
        <label className="block text-xs text-paper/60">
          Titre
          <input value={album.title} onChange={(e) => set("title", e.target.value)} required maxLength={120} className={fieldCls} name="title" />
        </label>
        <label className="block text-xs text-paper/60">
          Adresse : /series/…
          <input value={album.slug} onChange={(e) => set("slug", e.target.value)} required maxLength={80} className={fieldCls} name="slug" />
        </label>
        <label className="block text-xs text-paper/60">
          Sous-titre (ex. : Compétition moto)
          <input value={album.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} maxLength={160} className={fieldCls} name="subtitle" />
        </label>
        <label className="block text-xs text-paper/60">
          Discipline
          <select value={album.category ?? ""} onChange={(e) => set("category", e.target.value || null)} className={fieldCls} name="category">
            <option value="">— Aucune —</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-paper/60">
          Lieu
          <input value={album.location ?? ""} onChange={(e) => set("location", e.target.value)} maxLength={120} className={fieldCls} name="location" />
        </label>
        <label className="block text-xs text-paper/60">
          Date
          <input type="date" value={album.event_date ?? ""} onChange={(e) => set("event_date", e.target.value)} className={fieldCls} name="event_date" />
        </label>
        <label className="block text-xs text-paper/60 md:col-span-2">
          Texte de présentation
          <textarea value={album.description ?? ""} onChange={(e) => set("description", e.target.value)} rows={4} maxLength={4000} className={fieldCls} name="description" />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-4 md:col-span-2">
          <div className="w-64">
            <Toggle label="Série en ligne" checked={album.published} onChange={(v) => set("published", v)} />
          </div>
          <div className="flex items-center gap-4">
            {confirmDelete ? (
              <span className="flex items-center gap-2 text-sm">
                Supprimer la série ?
                <button type="button" onClick={deleteAlbum} className="bg-red px-3 py-1.5 text-white">
                  Oui
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="px-2 text-paper/60">
                  Non
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="text-sm text-red hover:underline">
                Supprimer la série
              </button>
            )}
            <button type="submit" disabled={saving} className="btn btn-red disabled:opacity-60">
              {saving ? "…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </form>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="display text-3xl">Photos de la série ({photos.length})</h2>
            <p className="mt-1 text-sm text-paper/50">Glissez-déposez pour changer l&apos;ordre (clavier : Espace puis flèches). ● = couverture.</p>
          </div>
          <button type="button" onClick={openPicker} className="btn btn-ghost">
            + Ajouter depuis la bibliothèque
          </button>
        </div>

        <div className="mt-4">
          <Uploader
            categories={categories}
            albums={allAlbums}
            fixedAlbum={album}
            onUploaded={(added) => setPhotos((list) => [...list, ...added].sort((a, b) => a.sort_order - b.sort_order))}
          />
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
            <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" data-testid="album-photos">
              {photos.map((p, i) => (
                <SortablePhoto
                  key={p.id}
                  photo={p}
                  index={i}
                  isCover={album.cover_photo_id === p.id || (!album.cover_photo_id && i === 0)}
                  onEdit={() => setEditing(p)}
                  onCover={() => setCover(p.id)}
                  onRemove={() => removeFromAlbum(p.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </section>

      {picker && <Picker photos={picker} onCancel={() => setPicker(null)} onConfirm={addPhotos} />}

      {editing && (
        <PhotoEditor
          key={editing.id}
          photo={editing}
          categories={categories}
          albums={allAlbums.map((a) => (a.id === album.id ? album : a))}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          onDeleted={(pid) => {
            setPhotos((list) => list.filter((x) => x.id !== pid));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function SortablePhoto({
  photo,
  index,
  isCover,
  onEdit,
  onCover,
  onRemove,
}: {
  photo: Photo;
  index: number;
  isCover: boolean;
  onEdit: () => void;
  onCover: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative bg-ink-2 ${isDragging ? "z-10 opacity-80 shadow-2xl" : ""}`}
      data-testid="album-photo"
      data-id={photo.id}
    >
      <div {...attributes} {...listeners} className="relative aspect-[4/3] cursor-grab touch-manipulation overflow-hidden bg-black active:cursor-grabbing" aria-label={`Déplacer la photo ${index + 1}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoSrc(photo).thumb} alt="" draggable={false} className={`h-full w-full object-cover ${photo.published ? "" : "opacity-40"}`} />
        <span className="absolute left-1 top-1 bg-black/70 px-1.5 text-xs">{index + 1}</span>
        {isCover && <span className="absolute right-1 top-1 bg-red px-1.5 text-xs font-bold text-white">● Couverture</span>}
      </div>
      <div className="flex items-center justify-between gap-1 p-1.5 text-xs">
        <button type="button" onClick={onEdit} className="truncate px-1 py-1 text-left hover:text-red">
          {photo.title || "Sans titre"}
        </button>
        <span className="flex shrink-0">
          {!isCover && (
            <button type="button" onClick={onCover} title="Définir comme couverture" aria-label="Définir comme couverture" className="px-1.5 py-1 text-paper/60 hover:text-paper">
              ●
            </button>
          )}
          <button type="button" onClick={onRemove} title="Retirer de la série" aria-label="Retirer de la série" className="px-1.5 py-1 text-paper/60 hover:text-red">
            ✕
          </button>
        </span>
      </div>
    </li>
  );
}

function Picker({ photos, onCancel, onConfirm }: { photos: Photo[]; onCancel: () => void; onConfirm: (ids: string[]) => void }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Ajouter des photos">
      <div className="flex max-h-[90svh] w-full max-w-5xl flex-col border border-line bg-ink-2">
        <div className="flex items-center justify-between border-b border-line p-4">
          <p className="eyebrow">Ajouter à la série — {sel.size} sélectionnée(s)</p>
          <button type="button" onClick={onCancel} className="px-2 text-2xl leading-none text-paper/60" aria-label="Fermer">
            ×
          </button>
        </div>
        <ul className="grid flex-1 grid-cols-3 gap-2 overflow-y-auto p-4 sm:grid-cols-5 lg:grid-cols-7">
          {photos.length === 0 && <li className="col-span-full text-paper/50">Toutes les photos sont déjà dans cette série.</li>}
          {photos.map((p) => {
            const on = sel.has(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() =>
                    setSel((s) => {
                      const n = new Set(s);
                      if (on) n.delete(p.id);
                      else n.add(p.id);
                      return n;
                    })
                  }
                  className={`relative block aspect-square w-full overflow-hidden ${on ? "outline outline-2 outline-red" : ""}`}
                  title={p.title ?? ""}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoSrc(p).thumb} alt={p.title ?? ""} loading="lazy" className={`h-full w-full object-cover ${on ? "opacity-60" : ""}`} />
                  {on && <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex justify-end gap-3 border-t border-line p-4">
          <button type="button" onClick={onCancel} className="btn btn-ghost">
            Annuler
          </button>
          <button type="button" onClick={() => onConfirm([...sel])} disabled={!sel.size} className="btn btn-red disabled:opacity-50">
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
