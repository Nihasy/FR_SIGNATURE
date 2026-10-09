"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { Logo } from "@/components/Logo";
import { browserClient } from "@/lib/supabase/browser";
import { AdminProvider } from "./AdminContext";

const links = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/photos", label: "Photos" },
  { href: "/admin/series", label: "Séries" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/reglages", label: "Réglages" },
];

type State = { status: "loading" } | { status: "anon" } | { status: "forbidden"; user: User } | { status: "ok"; user: User };

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = browserClient();
  const [state, setState] = useState<State>({ status: "loading" });
  const [unread, setUnread] = useState(0);
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    let cancelled = false;
    async function check(user: User | null) {
      if (!user) {
        if (!cancelled) setState({ status: "anon" });
        return;
      }
      const { data } = await supabase.rpc("is_admin");
      if (!cancelled) setState(data === true ? { status: "ok", user } : { status: "forbidden", user });
    }
    supabase.auth.getUser().then(({ data }) => check(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        // Évite qu'un état « anonyme » encore en place ne renvoie vers la connexion pendant la redirection.
        setState({ status: "loading" });
        check(session?.user ?? null);
      } else if (event === "SIGNED_OUT") {
        check(null);
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (state.status === "anon" && !isLogin) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [state.status, isLogin, pathname, router]);

  useEffect(() => {
    if (state.status !== "ok") return;
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("read", false)
      .then(({ count }) => setUnread(count ?? 0));
  }, [state.status, pathname, supabase]);

  if (isLogin) return <>{children}</>;

  if (state.status === "loading" || state.status === "anon") {
    return (
      <div className="flex min-h-[100svh] items-center justify-center">
        <p className="eyebrow animate-pulse text-paper/50">Chargement…</p>
      </div>
    );
  }

  if (state.status === "forbidden") {
    return (
      <div className="container-x flex min-h-[100svh] flex-col justify-center">
        <p className="eyebrow text-red">Accès refusé</p>
        <h1 className="display mt-4 text-5xl">Ce compte n&apos;est pas administrateur.</h1>
        <p className="mt-4 text-paper/60">{state.user.email}</p>
        <button type="button" className="btn btn-ghost mt-8 w-fit" onClick={() => supabase.auth.signOut()}>
          Se déconnecter
        </button>
      </div>
    );
  }

  return (
    <AdminProvider supabase={supabase} user={state.user}>
      <div className="min-h-[100svh] md:grid md:grid-cols-[240px_1fr]">
        <aside className="border-b border-line bg-ink-2 md:sticky md:top-0 md:h-[100svh] md:border-b-0 md:border-r">
          <div className="flex items-center justify-between p-4 md:block md:p-6">
            <Link href="/admin" className="text-sm">
              <Logo />
            </Link>
            <p className="eyebrow mt-2 hidden text-paper/40 md:block">Back-office</p>
          </div>
          <nav aria-label="Back-office" className="no-scrollbar overflow-x-auto">
            <ul className="flex gap-1 px-2 pb-2 md:flex-col md:px-3">
              {links.map((l) => {
                const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center justify-between gap-3 whitespace-nowrap px-3 py-2.5 text-sm transition-colors ${
                        active ? "bg-paper text-ink" : "text-paper/70 hover:bg-ink-3 hover:text-paper"
                      }`}
                    >
                      {l.label}
                      {l.href === "/admin/messages" && unread > 0 && (
                        <span className="bg-red px-1.5 text-xs font-bold text-white">{unread}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="hidden space-y-3 border-t border-line p-6 text-sm md:absolute md:inset-x-0 md:bottom-0 md:block">
            <a href="/" target="_blank" rel="noopener noreferrer" className="block text-paper/70 hover:text-paper">
              Voir le site ↗
            </a>
            <p className="truncate text-xs text-paper/40" title={state.user.email}>
              {state.user.email}
            </p>
            <button type="button" className="text-paper/70 hover:text-red" onClick={() => supabase.auth.signOut()}>
              Se déconnecter
            </button>
          </div>
        </aside>
        <div className="min-w-0">
          {children}
          <div className="flex gap-4 border-t border-line p-4 text-sm md:hidden">
            <a href="/" target="_blank" rel="noopener noreferrer" className="text-paper/70">
              Voir le site ↗
            </a>
            <button type="button" className="text-paper/70" onClick={() => supabase.auth.signOut()}>
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </AdminProvider>
  );
}
