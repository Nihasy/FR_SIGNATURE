"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { refreshPublicSite } from "@/app/admin/actions";

type Toast = { id: number; text: string; tone: "ok" | "error" };

type AdminCtx = {
  supabase: SupabaseClient;
  user: User;
  /** Invalide le cache du site public après une modification. */
  publish: () => Promise<void>;
  toast: (text: string, tone?: Toast["tone"]) => void;
};

const Ctx = createContext<AdminCtx | null>(null);

export function useAdmin() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAdmin doit être utilisé dans le back-office");
  return ctx;
}

export function AdminProvider({ supabase, user, children }: { supabase: SupabaseClient; user: User; children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const toast = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, text, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === "error" ? 7000 : 3500);
  }, []);

  const publish = useCallback(async () => {
    try {
      const res = await refreshPublicSite();
      if (!res.ok) toast("Site public non rafraîchi : session expirée ?", "error");
    } catch {
      toast("Site public non rafraîchi (réseau).", "error");
    }
  }, [toast]);

  return (
    <Ctx.Provider value={{ supabase, user, publish, toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <p
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto max-w-sm px-4 py-3 text-sm shadow-lg ${t.tone === "error" ? "bg-red text-white" : "bg-paper text-ink"}`}
          >
            {t.text}
          </p>
        ))}
      </div>
    </Ctx.Provider>
  );
}
