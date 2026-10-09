"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/AdminContext";
import { slugify } from "@/lib/admin/api";
import type { Category, Settings } from "@/lib/types";

const fieldCls = "mt-1 w-full border border-line bg-ink px-3 py-2 text-sm focus:border-red focus:outline-none";

const settingFields: { key: keyof Settings; label: string; placeholder?: string; type?: string }[] = [
  { key: "email", label: "E-mail de contact", type: "email" },
  { key: "phone", label: "Téléphone affiché", placeholder: "+261 34 00 000 00" },
  { key: "whatsapp", label: "Numéro WhatsApp (format international)", placeholder: "+261340000000" },
  { key: "instagram_url", label: "Lien Instagram", placeholder: "https://www.instagram.com/…", type: "url" },
  { key: "facebook_url", label: "Lien Facebook", placeholder: "https://www.facebook.com/…", type: "url" },
  { key: "linkedin_url", label: "Lien LinkedIn", type: "url" },
  { key: "location", label: "Localisation", placeholder: "Antananarivo, Madagascar" },
  { key: "availability", label: "Phrase de disponibilité (page contact)" },
];

export default function SettingsPage() {
  const { supabase, publish, toast } = useAdmin();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCat, setNewCat] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [s, c] = await Promise.all([
      supabase.from("settings").select("*").eq("id", 1).single(),
      supabase.from("categories").select("*").order("sort_order"),
    ]);
    setSettings(s.data);
    setCategories(c.data ?? []);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial
    load();
  }, [load]);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    const patch: Record<string, string | null> = {};
    for (const f of settingFields) {
      let v = settings[f.key]?.trim() || null;
      if (v && f.type === "url") {
        // « instagram.com/compte » → « https://instagram.com/compte »
        if (!/^https?:\/\//i.test(v)) v = `https://${v.replace(/^\/+/, "")}`;
        try {
          new URL(v);
        } catch {
          return toast(`${f.label} : lien invalide.`, "error");
        }
      }
      patch[f.key] = v;
    }
    setSaving(true);
    const { error } = await supabase.from("settings").update(patch).eq("id", 1);
    setSaving(false);
    if (error) return toast(error.message, "error");
    setSettings({ ...settings, ...patch });
    await publish();
    toast("Réglages enregistrés.");
  }

  async function saveCategory(c: Category) {
    const { error } = await supabase.from("categories").update({ name: c.name.trim(), description: c.description?.trim() || null, sort_order: c.sort_order }).eq("slug", c.slug);
    if (error) return toast(error.message, "error");
    await publish();
    toast(`Discipline « ${c.name} » enregistrée.`);
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    const slug = slugify(newCat);
    if (!slug) return;
    const { error } = await supabase.from("categories").insert({ slug, name: newCat.trim(), sort_order: categories.length + 1 });
    if (error) return toast(error.code === "23505" ? "Cette discipline existe déjà." : error.message, "error");
    setNewCat("");
    await load();
    await publish();
  }

  async function removeCategory(c: Category) {
    const { count } = await supabase.from("photos").select("id", { count: "exact", head: true }).eq("category", c.slug);
    if (count && !window.confirm(`${count} photo(s) utilisent « ${c.name} ». Elles n'auront plus de discipline. Continuer ?`)) return;
    const { error } = await supabase.from("categories").delete().eq("slug", c.slug);
    if (error) return toast(error.message, "error");
    await load();
    await publish();
    toast("Discipline supprimée.");
  }

  if (!settings) return <p className="eyebrow animate-pulse p-8 text-paper/50">Chargement…</p>;

  return (
    <div className="p-4 md:p-8">
      <p className="eyebrow text-paper/50">Site</p>
      <h1 className="display mt-2 text-5xl">Réglages</h1>

      <form onSubmit={saveSettings} className="mt-8 grid gap-4 border border-line bg-ink-2 p-4 md:grid-cols-2 md:p-6">
        <h2 className="display text-3xl md:col-span-2">Coordonnées & réseaux</h2>
        {settingFields.map((f) => (
          <label key={f.key} className={`block text-xs text-paper/60 ${f.key === "availability" ? "md:col-span-2" : ""}`}>
            {f.label}
            <input
              name={f.key}
              type={f.type === "email" ? "email" : "text"}
              inputMode={f.type === "url" ? "url" : undefined}
              value={settings[f.key] ?? ""}
              placeholder={f.placeholder}
              onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
              className={fieldCls}
            />
          </label>
        ))}
        <p className="text-xs text-paper/40 md:col-span-1">Un champ vide masque l&apos;élément correspondant sur le site.</p>
        <div className="flex justify-end md:col-span-1">
          <button type="submit" disabled={saving} className="btn btn-red disabled:opacity-60">
            {saving ? "…" : "Enregistrer"}
          </button>
        </div>
      </form>

      <section className="mt-10 border border-line bg-ink-2 p-4 md:p-6">
        <h2 className="display text-3xl">Disciplines</h2>
        <p className="mt-1 text-sm text-paper/50">Les filtres du portfolio et la section « Terrains de jeu » de l&apos;accueil.</p>
        <ul className="mt-6 space-y-3">
          {categories.map((c, i) => (
            <li key={c.slug} className="grid items-end gap-2 border-b border-line pb-3 md:grid-cols-[4rem_1fr_2fr_auto]">
              <label className="text-xs text-paper/60">
                Ordre
                <input
                  type="number"
                  value={c.sort_order}
                  onChange={(e) => setCategories(categories.map((x, k) => (k === i ? { ...x, sort_order: Number(e.target.value) } : x)))}
                  className={fieldCls}
                />
              </label>
              <label className="text-xs text-paper/60">
                Nom
                <input value={c.name} onChange={(e) => setCategories(categories.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} className={fieldCls} />
              </label>
              <label className="text-xs text-paper/60">
                Description
                <input
                  value={c.description ?? ""}
                  onChange={(e) => setCategories(categories.map((x, k) => (k === i ? { ...x, description: e.target.value } : x)))}
                  className={fieldCls}
                />
              </label>
              <span className="flex gap-2">
                <button type="button" onClick={() => saveCategory(c)} className="border border-line px-3 py-2 text-sm hover:bg-ink-3">
                  Enregistrer
                </button>
                <button type="button" onClick={() => removeCategory(c)} className="px-2 py-2 text-sm text-red" aria-label={`Supprimer ${c.name}`}>
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>
        <form onSubmit={addCategory} className="mt-4 flex gap-2">
          <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="Nouvelle discipline" aria-label="Nouvelle discipline" maxLength={60} className={`${fieldCls} mt-0 max-w-xs`} />
          <button type="submit" className="btn btn-ghost">
            Ajouter
          </button>
        </form>
      </section>
    </div>
  );
}
