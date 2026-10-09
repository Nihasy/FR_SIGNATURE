"use client";

import { useEffect, useState } from "react";
import { deletePhotos, formatBytes, PHOTO_COLUMNS } from "@/lib/admin/api";
import { photoSrc } from "@/lib/images";
import type { Album, Category, Photo } from "@/lib/types";
import { useAdmin } from "./AdminContext";

const fieldCls = "mt-1 w-full border border-line bg-ink px-3 py-2 text-sm focus:border-red focus:outline-none";

/** Panneau latéral d'édition d'une photo. */
export function PhotoEditor({
  photo,
  categories,
  albums,
  onClose,
  onSaved,
  onDeleted,
}: {
  photo: Photo;
  categories: Category[];
  albums: Pick<Album, "id" | "title" | "cover_photo_id">[];
  onClose: () => void;
  onSaved: (photo: Photo) => void;
  onDeleted: (id: string) => void;
}) {
  const { supabase, publish, toast } = useAdmin();
  const [draft, setDraft] = useState(photo);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const album = albums.find((a) => a.id === draft.album_id);
  const isCover = album?.cover_photo_id === photo.id;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = <K extends keyof Photo>(k: K, v: Photo[K]) => setDraft((d) => ({ ...d, [k]: v }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await supabase
      .from("photos")
      .update({
        title: draft.title?.trim() || null,
        alt: draft.alt?.trim() || null,
        category: draft.category || null,
        album_id: draft.album_id || null,
        published: draft.published,
        featured: draft.featured,
        hero: draft.hero,
      })
      .eq("id", photo.id)
      .select(PHOTO_COLUMNS)
      .single();
    setSaving(false);
    if (error) return toast(`Erreur : ${error.message}`, "error");
    onSaved(data as Photo);
    await publish();
    toast("Photo enregistrée.");
  }

  async function makeCover() {
    if (!album) return;
    const { error } = await supabase.from("albums").update({ cover_photo_id: photo.id }).eq("id", album.id);
    if (error) return toast(`Erreur : ${error.message}`, "error");
    await publish();
    toast(`Couverture de « ${album.title} » mise à jour.`);
    onSaved({ ...draft });
  }

  async function remove() {
    setSaving(true);
    try {
      await deletePhotos(supabase, [photo]);
      onDeleted(photo.id);
      await publish();
      toast("Photo supprimée.");
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "error");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form
        onSubmit={save}
        role="dialog"
        aria-modal="true"
        aria-label="Modifier la photo"
        className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-line bg-ink-2"
      >
        <div className="flex items-center justify-between border-b border-line p-4">
          <p className="eyebrow">Modifier la photo</p>
          <button type="button" onClick={onClose} className="px-2 text-2xl leading-none text-paper/60 hover:text-paper" aria-label="Fermer">
            ×
          </button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoSrc(photo).thumb} alt="" className="max-h-72 w-full bg-black object-contain" />
        <div className="space-y-4 p-4">
          <p className="text-xs text-paper/40">
            {photo.width} × {photo.height} px · {formatBytes(photo.bytes)}
            {photo.original_name && <> · {photo.original_name}</>}
          </p>
          <label className="block text-xs text-paper/60">
            Titre
            <input value={draft.title ?? ""} onChange={(e) => set("title", e.target.value)} maxLength={160} className={fieldCls} name="title" />
          </label>
          <label className="block text-xs text-paper/60">
            Description pour l&apos;accessibilité et le référencement (texte alternatif)
            <textarea
              value={draft.alt ?? ""}
              onChange={(e) => set("alt", e.target.value)}
              maxLength={300}
              rows={2}
              placeholder="Ex. : Moto de cross en plein saut sur une piste de terre rouge"
              className={fieldCls}
              name="alt"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs text-paper/60">
              Discipline
              <select value={draft.category ?? ""} onChange={(e) => set("category", e.target.value || null)} className={fieldCls} name="category">
                <option value="">— Aucune —</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-paper/60">
              Série
              <select value={draft.album_id ?? ""} onChange={(e) => set("album_id", e.target.value || null)} className={fieldCls} name="album">
                <option value="">— Aucune —</option>
                {albums.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <fieldset className="space-y-3 border border-line p-3">
            <legend className="px-1 text-xs text-paper/60">Visibilité</legend>
            <Toggle label="Publiée sur le site" checked={draft.published} onChange={(v) => set("published", v)} />
            <Toggle label="Sélection « Images signature » (accueil)" checked={draft.featured} onChange={(v) => set("featured", v)} />
            <Toggle label="Diaporama plein écran de l'accueil" checked={draft.hero} onChange={(v) => set("hero", v)} />
          </fieldset>
          {album && photo.album_id === album.id && (
            <button type="button" onClick={makeCover} disabled={isCover} className="text-sm text-paper/70 underline-offset-4 hover:underline disabled:no-underline disabled:opacity-50">
              {isCover ? "✓ Couverture de la série" : `Définir comme couverture de « ${album.title} »`}
            </button>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line p-4">
          {confirmDelete ? (
            <span className="flex items-center gap-2 text-sm">
              Supprimer définitivement ?
              <button type="button" onClick={remove} disabled={saving} className="bg-red px-3 py-1.5 text-white">
                Oui
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="px-2 py-1.5 text-paper/60">
                Non
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="text-sm text-red hover:underline">
              Supprimer
            </button>
          )}
          <button type="submit" disabled={saving} className="btn btn-red disabled:opacity-60">
            {saving ? "…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 text-sm">
      {label}
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span
        aria-hidden="true"
        className="relative h-5 w-9 shrink-0 bg-ink-3 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:bg-paper/70 after:transition-transform peer-checked:bg-red peer-checked:after:translate-x-4 peer-checked:after:bg-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-red"
      />
    </label>
  );
}
