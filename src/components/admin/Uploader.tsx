"use client";

import { useRef, useState } from "react";
import { runLimited, uploadPhoto, type UploadStep } from "@/lib/admin/api";
import { checkFile } from "@/lib/admin/process-image";
import type { Album, Category, Photo } from "@/lib/types";
import { useAdmin } from "./AdminContext";

type Item = { key: string; name: string; status: UploadStep | "en attente" | "terminé" | "erreur"; error?: string };

export function Uploader({
  categories,
  albums,
  fixedAlbum,
  onUploaded,
}: {
  categories: Category[];
  albums: Pick<Album, "id" | "title" | "category">[];
  fixedAlbum?: Pick<Album, "id" | "title" | "category">;
  onUploaded: (photos: Photo[]) => void;
}) {
  const { supabase, publish, toast } = useAdmin();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [category, setCategory] = useState<string>(fixedAlbum?.category ?? "");
  const [albumId, setAlbumId] = useState<string>(fixedAlbum?.id ?? "");
  const [published, setPublished] = useState(true);

  function update(key: string, patch: Partial<Item>) {
    setItems((list) => list.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (!files.length || busy) return;
    const queue = files.map((f, i) => ({ file: f, key: `${Date.now()}-${i}-${f.name}` }));
    setItems(queue.map(({ file, key }) => {
      const err = checkFile(file);
      return { key, name: file.name, status: err ? "erreur" : "en attente", error: err ?? undefined };
    }));
    const valid = queue.filter(({ file }) => !checkFile(file));
    setBusy(true);
    const done: Photo[] = [];
    await runLimited(valid, 2, async ({ file, key }) => {
      try {
        const photo = await uploadPhoto(
          supabase,
          file,
          { category: category || null, albumId: albumId || null, published },
          (step) => update(key, { status: step }),
        );
        done.push(photo);
        update(key, { status: "terminé" });
      } catch (e) {
        update(key, { status: "erreur", error: e instanceof Error ? e.message : String(e) });
      }
    });
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    if (done.length) {
      onUploaded(done);
      await publish();
      toast(`${done.length} photo${done.length > 1 ? "s" : ""} importée${done.length > 1 ? "s" : ""}.`);
    }
    const failed = files.length - done.length;
    if (failed) toast(`${failed} fichier${failed > 1 ? "s" : ""} en erreur.`, "error");
  }

  const doneCount = items.filter((i) => i.status === "terminé").length;
  const selectCls = "mt-1 w-full border border-line bg-ink px-3 py-2 text-sm focus:border-red focus:outline-none";

  return (
    <section aria-label="Importer des photos" className="border border-line bg-ink-2 p-4 md:p-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-xs text-paper/60">
          Discipline
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls} disabled={busy}>
            <option value="">— Aucune —</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {fixedAlbum ? (
          <p className="text-xs text-paper/60">
            Série
            <span className="mt-1 block border border-line px-3 py-2 text-sm text-paper">{fixedAlbum.title}</span>
          </p>
        ) : (
          <label className="text-xs text-paper/60">
            Série
            <select
              value={albumId}
              onChange={(e) => {
                setAlbumId(e.target.value);
                const a = albums.find((x) => x.id === e.target.value);
                if (a?.category && !category) setCategory(a.category);
              }}
              className={selectCls}
              disabled={busy}
            >
              <option value="">— Aucune —</option>
              {albums.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex items-end gap-3 pb-2 text-sm">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} disabled={busy} className="h-4 w-4 accent-[var(--red)]" />
          Publier directement
        </label>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`mt-4 flex flex-col items-center justify-center gap-3 border-2 border-dashed px-4 py-10 text-center transition-colors ${
          drag ? "border-red bg-red/10" : "border-line"
        }`}
      >
        <p className="display text-3xl">{busy ? "Import en cours…" : "Déposez vos photos ici"}</p>
        <p className="text-sm text-paper/50">
          JPEG, PNG, WebP — redimensionnées automatiquement (2400 px, WebP) avant l&apos;envoi.
        </p>
        <button type="button" className="btn btn-ghost mt-2" onClick={() => inputRef.current?.click()} disabled={busy}>
          Choisir des fichiers
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          data-testid="upload-input"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {items.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm text-paper/60" aria-live="polite">
            {doneCount} / {items.length} importée{doneCount > 1 ? "s" : ""}
          </p>
          <ul className="max-h-56 space-y-1 overflow-y-auto text-sm">
            {items.map((it) => (
              <li key={it.key} className="flex items-center justify-between gap-4 border-b border-line py-1.5">
                <span className="truncate">{it.name}</span>
                <span
                  className={`shrink-0 text-xs ${it.status === "erreur" ? "text-red" : it.status === "terminé" ? "text-green-400" : "text-paper/50"}`}
                  title={it.error}
                >
                  {it.status === "erreur" ? it.error ?? "erreur" : it.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
