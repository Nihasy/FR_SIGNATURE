"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { browserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const { error } = await browserClient().auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (error) {
      setPending(false);
      setError(error.message === "Invalid login credentials" ? "E-mail ou mot de passe incorrect." : error.message);
      return;
    }
    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(next && next.startsWith("/admin") && !next.startsWith("/admin/login") ? next : "/admin");
  }

  return (
    <main className="flex min-h-[100svh] items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm">
        <Logo className="text-lg" />
        <h1 className="display mt-10 text-5xl">Back-office</h1>
        <p className="mt-2 text-paper/50">Gestion des photos et du site.</p>
        <label className="eyebrow mt-10 block text-paper/60" htmlFor="email">
          E-mail
        </label>
        <input id="email" name="email" type="email" required autoComplete="username" className="mt-2 w-full border border-line bg-ink-2 px-4 py-3 focus:border-red focus:outline-none" />
        <label className="eyebrow mt-6 block text-paper/60" htmlFor="password">
          Mot de passe
        </label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="mt-2 w-full border border-line bg-ink-2 px-4 py-3 focus:border-red focus:outline-none" />
        {error && (
          <p role="alert" className="mt-4 text-sm text-red">
            {error}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn btn-red mt-8 w-full justify-center disabled:opacity-60">
          {pending ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
