"use client";

import { useActionState } from "react";
import { contactSubjects } from "@/lib/site";
import { sendMessage, type ContactState } from "./actions";

const initial: ContactState = { status: "idle" };

const inputCls =
  "mt-2 w-full border-0 border-b border-line bg-transparent px-0 py-3 text-lg text-paper placeholder:text-paper/30 focus:border-red focus:outline-none focus:ring-0 aria-[invalid=true]:border-red";

export function ContactForm() {
  const [state, action, pending] = useActionState(sendMessage, initial);

  if (state.status === "success") {
    return (
      <div role="status" className="border border-line p-8 md:p-12">
        <p className="eyebrow text-red">Message envoyé</p>
        <p className="display mt-6 text-4xl md:text-5xl">Merci !</p>
        <p className="mt-4 text-paper/70">{state.message}</p>
      </div>
    );
  }

  const f = state.fields ?? {};
  const e = state.errors ?? {};

  return (
    <form action={action} noValidate className="grid gap-8 sm:grid-cols-2">
      <div className="hidden" aria-hidden="true">
        <label>
          Site web <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <Field label="Nom *" error={e.name} id="name">
        <input id="name" name="name" required autoComplete="name" defaultValue={f.name} aria-invalid={!!e.name} aria-describedby={e.name ? "name-error" : undefined} className={inputCls} />
      </Field>
      <Field label="E-mail *" error={e.email} id="email">
        <input id="email" name="email" type="email" required autoComplete="email" defaultValue={f.email} aria-invalid={!!e.email} aria-describedby={e.email ? "email-error" : undefined} className={inputCls} />
      </Field>
      <Field label="Téléphone" id="phone">
        <input id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={f.phone} className={inputCls} />
      </Field>
      <Field label="Entreprise / marque" id="company">
        <input id="company" name="company" autoComplete="organization" defaultValue={f.company} className={inputCls} />
      </Field>
      <Field label="Type de projet" id="service" wide>
        <select id="service" name="service" defaultValue={f.service ?? ""} className={`${inputCls} [&>option]:bg-ink`}>
          <option value="">Choisir…</option>
          {contactSubjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Votre projet *" error={e.message} id="message" wide>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          defaultValue={f.message}
          placeholder="Date, lieu, véhicules, livrables attendus…"
          aria-invalid={!!e.message}
          aria-describedby={e.message ? "message-error" : undefined}
          className={`${inputCls} resize-y`}
        />
      </Field>
      <div className="flex flex-col gap-4 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <p role={state.status === "error" ? "alert" : undefined} className={`text-sm ${state.status === "error" ? "text-red" : "text-paper/40"}`}>
          {state.status === "error" ? state.message : "Réponse sous 48 h. Vos données servent uniquement à vous recontacter."}
        </p>
        <button type="submit" disabled={pending} className="btn btn-red justify-center disabled:opacity-60">
          {pending ? "Envoi…" : "Envoyer"} <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
}

function Field({ label, error, id, wide, children }: { label: string; error?: string; id: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className="eyebrow text-paper/60">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-red">
          {error}
        </p>
      )}
    </div>
  );
}
