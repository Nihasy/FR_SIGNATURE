import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Charge .env.local pour les tests (URL + clés Supabase locales).
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@fr-signature.test";
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "TestAdmin-2026!";
export const FIXTURES = "tests/.fixtures";
export const TAG = "E2E";

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
export const anon = () => createClient(SUPABASE_URL, ANON_KEY, opts);
export const service = () => createClient(SUPABASE_URL, SERVICE_KEY, opts);
