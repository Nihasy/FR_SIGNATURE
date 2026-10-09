"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/AdminContext";
import type { Message } from "@/lib/types";

export default function MessagesPage() {
  const { supabase, toast } = useAdmin();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<"tous" | "non-lus">("tous");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) toast(error.message, "error");
    setMessages((data as Message[]) ?? []);
  }, [supabase, toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial
    load();
  }, [load]);

  async function setRead(m: Message, read: boolean) {
    const { error } = await supabase.from("messages").update({ read }).eq("id", m.id);
    if (error) return toast(error.message, "error");
    setMessages((list) => list?.map((x) => (x.id === m.id ? { ...x, read } : x)) ?? null);
  }

  async function toggle(m: Message) {
    const next = open === m.id ? null : m.id;
    setOpen(next);
    if (next && !m.read) await setRead(m, true);
  }

  async function remove(id: string) {
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) return toast(error.message, "error");
    setMessages((list) => list?.filter((x) => x.id !== id) ?? null);
    setConfirmId(null);
    toast("Message supprimé.");
  }

  const list = (messages ?? []).filter((m) => filter === "tous" || !m.read);
  const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="p-4 md:p-8">
      <p className="eyebrow text-paper/50">Formulaire de contact</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-5xl">Messages</h1>
        <div className="flex gap-1 text-sm" role="group" aria-label="Filtrer">
          {(["tous", "non-lus"] as const).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={`px-3 py-1.5 ${filter === f ? "bg-paper text-ink" : "border border-line"}`}>
              {f === "tous" ? "Tous" : "Non lus"}
            </button>
          ))}
        </div>
      </div>

      {messages === null ? (
        <p className="eyebrow mt-10 animate-pulse text-paper/50">Chargement…</p>
      ) : list.length === 0 ? (
        <p className="mt-10 text-paper/50">Aucun message.</p>
      ) : (
        <ul className="mt-8 divide-y divide-line border-y border-line" data-testid="messages">
          {list.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => toggle(m)} aria-expanded={open === m.id} className="flex w-full items-baseline gap-4 py-4 text-left hover:bg-ink-2">
                <span className={`h-2 w-2 shrink-0 ${m.read ? "bg-transparent" : "bg-red"}`} aria-label={m.read ? undefined : "Non lu"} />
                <span className={`w-44 shrink-0 truncate ${m.read ? "" : "font-bold"}`}>{m.name}</span>
                <span className="min-w-0 flex-1 truncate text-paper/60">
                  {m.service && <span className="text-paper/80">{m.service} — </span>}
                  {m.message}
                </span>
                <time className="hidden shrink-0 text-xs text-paper/40 sm:block" dateTime={m.created_at}>
                  {fmt.format(new Date(m.created_at))}
                </time>
              </button>
              {open === m.id && (
                <div className="grid gap-6 bg-ink-2 p-4 md:grid-cols-3 md:p-6">
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-paper/40">E-mail</dt>
                      <dd>
                        <a className="underline" href={`mailto:${m.email}`}>
                          {m.email}
                        </a>
                      </dd>
                    </div>
                    {m.phone && (
                      <div>
                        <dt className="text-paper/40">Téléphone</dt>
                        <dd>
                          <a className="underline" href={`tel:${m.phone.replace(/\s/g, "")}`}>
                            {m.phone}
                          </a>
                        </dd>
                      </div>
                    )}
                    {m.company && (
                      <div>
                        <dt className="text-paper/40">Entreprise</dt>
                        <dd>{m.company}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-paper/40">Reçu le</dt>
                      <dd>{fmt.format(new Date(m.created_at))}</dd>
                    </div>
                  </dl>
                  <div className="md:col-span-2">
                    <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                    <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
                      <a
                        className="btn btn-red"
                        href={`mailto:${m.email}?subject=${encodeURIComponent(`Re : ${m.service ?? "votre demande"} — FR Signature Auto`)}`}
                      >
                        Répondre par e-mail
                      </a>
                      <button type="button" onClick={() => setRead(m, !m.read)} className="border border-line px-3 py-2">
                        Marquer comme {m.read ? "non lu" : "lu"}
                      </button>
                      {confirmId === m.id ? (
                        <span className="flex items-center gap-2">
                          Supprimer ?
                          <button type="button" onClick={() => remove(m.id)} className="bg-red px-3 py-2 text-white">
                            Oui
                          </button>
                          <button type="button" onClick={() => setConfirmId(null)} className="px-2 text-paper/60">
                            Non
                          </button>
                        </span>
                      ) : (
                        <button type="button" onClick={() => setConfirmId(m.id)} className="px-3 py-2 text-red hover:underline">
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
