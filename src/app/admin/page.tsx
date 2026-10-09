"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/AdminContext";
import { formatBytes } from "@/lib/admin/api";
import { STORAGE_QUOTA_BYTES } from "@/lib/env";
import type { Message } from "@/lib/types";

type Stats = {
  photos: number;
  drafts: number;
  featured: number;
  hero: number;
  albums: number;
  albumsOnline: number;
  bytes: number;
  unread: number;
  latest: Message[];
};

export default function DashboardPage() {
  const { supabase, toast } = useAdmin();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const [p, a, m] = await Promise.all([
        supabase.from("photos").select("published,featured,hero,bytes").limit(10000),
        supabase.from("albums").select("published"),
        supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(5),
      ]);
      if (p.error || a.error || m.error) toast((p.error ?? a.error ?? m.error)!.message, "error");
      const photos = p.data ?? [];
      const unread = await supabase.from("messages").select("id", { count: "exact", head: true }).eq("read", false);
      setStats({
        photos: photos.length,
        drafts: photos.filter((x) => !x.published).length,
        featured: photos.filter((x) => x.featured && x.published).length,
        hero: photos.filter((x) => x.hero && x.published).length,
        albums: a.data?.length ?? 0,
        albumsOnline: a.data?.filter((x) => x.published).length ?? 0,
        bytes: photos.reduce((s, x) => s + (x.bytes ?? 0), 0),
        unread: unread.count ?? 0,
        latest: (m.data as Message[]) ?? [],
      });
    })();
  }, [supabase, toast]);

  if (!stats) return <p className="eyebrow animate-pulse p-8 text-paper/50">Chargement…</p>;
  const pct = Math.min(100, (stats.bytes / STORAGE_QUOTA_BYTES) * 100);

  return (
    <div className="p-4 md:p-8">
      <p className="eyebrow text-paper/50">Back-office</p>
      <h1 className="display mt-2 text-5xl">Tableau de bord</h1>

      <dl className="mt-8 grid grid-cols-2 gap-px bg-line lg:grid-cols-4">
        {[
          { label: "Photos", value: stats.photos, sub: `${stats.drafts} brouillon(s)`, href: "/admin/photos" },
          { label: "Séries", value: stats.albums, sub: `${stats.albumsOnline} en ligne`, href: "/admin/series" },
          { label: "Messages non lus", value: stats.unread, sub: "Formulaire de contact", href: "/admin/messages" },
          { label: "Accueil", value: stats.hero, sub: `photos en diaporama · ${stats.featured} en sélection`, href: "/admin/photos" },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="bg-ink-2 p-5 transition-colors hover:bg-ink-3">
            <dt className="eyebrow text-paper/50">{s.label}</dt>
            <dd className="display mt-3 text-5xl" data-testid={`stat-${s.label}`}>
              {s.value}
            </dd>
            <dd className="mt-1 text-xs text-paper/50">{s.sub}</dd>
          </Link>
        ))}
      </dl>

      <section className="mt-8 border border-line bg-ink-2 p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="eyebrow text-paper/60">Stockage Supabase (offre gratuite)</h2>
          <p className="text-sm">
            {formatBytes(stats.bytes)} / 1 Go
          </p>
        </div>
        <div className="mt-3 h-2 bg-ink-3" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Stockage utilisé">
          <div className={`h-full ${pct > 85 ? "bg-red" : "bg-paper"}`} style={{ width: `${Math.max(pct, 0.5)}%` }} />
        </div>
        <p className="mt-3 text-xs text-paper/50">
          Chaque photo est compressée à l&apos;import (≈ 250 Ko en moyenne) : environ{" "}
          {Math.max(0, Math.floor((STORAGE_QUOTA_BYTES - stats.bytes) / 250_000)).toLocaleString("fr-FR")} photos peuvent encore être ajoutées.
        </p>
        {stats.hero === 0 && <p className="mt-3 text-sm text-red">Aucune photo n&apos;est marquée pour le diaporama d&apos;accueil : les photos paysage les plus récentes sont utilisées.</p>}
      </section>

      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="display text-3xl">Derniers messages</h2>
          <Link href="/admin/messages" className="text-sm text-paper/60 hover:text-paper">
            Tout voir →
          </Link>
        </div>
        {stats.latest.length === 0 ? (
          <p className="mt-4 text-paper/50">Aucun message pour le moment.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {stats.latest.map((m) => (
              <li key={m.id} className="flex items-baseline gap-4 py-3">
                {!m.read && <span className="h-2 w-2 shrink-0 bg-red" aria-label="Non lu" />}
                <span className="w-40 shrink-0 truncate font-semibold">{m.name}</span>
                <span className="min-w-0 flex-1 truncate text-paper/60">{m.service ? `${m.service} — ` : ""}{m.message}</span>
                <time className="shrink-0 text-xs text-paper/40" dateTime={m.created_at}>
                  {new Date(m.created_at).toLocaleDateString("fr-FR")}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 grid gap-3 sm:grid-cols-3">
        <Link href="/admin/photos" className="border border-line p-5 hover:border-red">
          <p className="display text-2xl">Importer des photos →</p>
          <p className="mt-2 text-sm text-paper/50">Glisser-déposer, redimensionnement automatique.</p>
        </Link>
        <Link href="/admin/series" className="border border-line p-5 hover:border-red">
          <p className="display text-2xl">Créer une série →</p>
          <p className="mt-2 text-sm text-paper/50">Un reportage, une course, une sortie.</p>
        </Link>
        <Link href="/admin/reglages" className="border border-line p-5 hover:border-red">
          <p className="display text-2xl">Coordonnées & réseaux →</p>
          <p className="mt-2 text-sm text-paper/50">Instagram, Facebook, WhatsApp, disciplines.</p>
        </Link>
      </section>
    </div>
  );
}
