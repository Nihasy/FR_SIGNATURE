// Crée (ou met à jour) le compte administrateur du back-office.
// Usage : node --env-file=.env.local scripts/create-admin.mjs email@exemple.com "MotDePasse"
import { createClient } from "@supabase/supabase-js";

const [email, password] = process.argv.slice(2);
if (!email || !password || password.length < 10) {
  console.error('Usage : node --env-file=.env.local scripts/create-admin.mjs <email> "<mot de passe ≥ 10 caractères>"');
  process.exit(1);
}
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

let user;
for (let page = 1; !user; page++) {
  const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
  if (error) throw error;
  user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (data.users.length < 200) break;
}

if (user) {
  const { error } = await db.auth.admin.updateUserById(user.id, { password, email_confirm: true });
  if (error) throw error;
  console.log("Mot de passe mis à jour pour", email);
} else {
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  user = data.user;
  console.log("Compte créé :", email);
}

const { error } = await db.from("admins").upsert({ user_id: user.id });
if (error) throw error;
console.log("Droits administrateur accordés.");
