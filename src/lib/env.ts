export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const BUCKET = "photos";
/** Quota de stockage de l'offre gratuite Supabase. */
export const STORAGE_QUOTA_BYTES = 1024 * 1024 * 1024;
