import { expect, test } from "@playwright/test";
import { anon, service, TAG } from "./helpers";

// Sécurité de la base : ce qu'un visiteur anonyme peut (et ne peut pas) faire.
test.describe("Sécurité Supabase (RLS)", () => {
  test("un visiteur lit les photos publiées mais pas les brouillons", async () => {
    const db = service();
    const { data: draft, error } = await db
      .from("photos")
      .insert({ path: `e2e/${Date.now()}/large.webp`, thumb_path: "e2e/thumb.webp", width: 10, height: 10, title: `${TAG} brouillon`, published: false })
      .select("id")
      .single();
    expect(error).toBeNull();

    const visitor = anon();
    const { data: published } = await visitor.from("photos").select("id").eq("published", true).limit(5);
    expect(published!.length).toBeGreaterThan(0);
    const { data: hidden } = await visitor.from("photos").select("id").eq("id", draft!.id);
    expect(hidden).toEqual([]);

    await db.from("photos").delete().eq("id", draft!.id);
  });

  test("un visiteur ne peut ni créer, ni modifier, ni supprimer de photo", async () => {
    const visitor = anon();
    const ins = await visitor.from("photos").insert({ path: "hack/x.webp", thumb_path: "hack/t.webp", width: 1, height: 1 });
    expect(ins.error).not.toBeNull();

    const { data: one } = await visitor.from("photos").select("id,title").eq("published", true).limit(1).single();
    const upd = await visitor.from("photos").update({ title: "piraté" }).eq("id", one!.id).select();
    expect(upd.data ?? []).toEqual([]);
    const del = await visitor.from("photos").delete().eq("id", one!.id).select();
    expect(del.data ?? []).toEqual([]);

    const { data: still } = await service().from("photos").select("title").eq("id", one!.id).single();
    expect(still!.title).toBe(one!.title);
  });

  test("un visiteur ne peut pas déposer de fichier dans le stockage", async () => {
    const res = await anon().storage.from("photos").upload(`hack/${Date.now()}.webp`, new Blob(["x"], { type: "image/webp" }));
    expect(res.error).not.toBeNull();
  });

  test("les séries non publiées et les messages restent privés", async () => {
    const db = service();
    const { data: album } = await db.from("albums").insert({ slug: `e2e-prive-${Date.now()}`, title: `${TAG} privée`, published: false }).select("id").single();
    const visitor = anon();
    expect((await visitor.from("albums").select("id").eq("id", album!.id)).data).toEqual([]);
    expect((await visitor.from("messages").select("id")).data ?? []).toEqual([]);
    expect((await visitor.from("admins").select("user_id")).data ?? []).toEqual([]);
    await db.from("albums").delete().eq("id", album!.id);
  });

  test("le formulaire de contact accepte un message puis limite les envois répétés", async () => {
    const visitor = anon();
    const email = `e2e-${Date.now()}@exemple.com`;
    for (let i = 0; i < 3; i++) {
      const r = await visitor.from("messages").insert({ name: `${TAG} limite`, email, message: "Message de test suffisamment long." });
      expect(r.error).toBeNull();
    }
    const blocked = await visitor.from("messages").insert({ name: `${TAG} limite`, email, message: "Message de test suffisamment long." });
    expect(blocked.error?.message).toContain("too_many_messages");

    const invalid = await visitor.from("messages").insert({ name: `${TAG} x`, email: "pas-un-email", message: "Message de test suffisamment long." });
    expect(invalid.error).not.toBeNull();

    // Un visiteur ne peut pas forcer le statut « lu »
    const email2 = `e2e2-${Date.now()}@exemple.com`;
    await visitor.from("messages").insert({ name: `${TAG} lu`, email: email2, message: "Message de test suffisamment long.", read: true });
    const { data } = await service().from("messages").select("read").eq("email", email2).single();
    expect(data!.read).toBe(false);
  });

  test("les inscriptions publiques sont désactivées", async () => {
    const { data, error } = await anon().auth.signUp({ email: `intrus-${Date.now()}@exemple.com`, password: "MotDePasse-123456" });
    expect(error ?? data.user === null).toBeTruthy();
  });

  test("un compte connecté mais non administrateur n'a aucun droit d'écriture", async () => {
    const db = service();
    const email = `lambda-${Date.now()}@exemple.com`;
    const { data: created } = await db.auth.admin.createUser({ email, password: "Lambda-123456!", email_confirm: true });
    const user = anon();
    const signIn = await user.auth.signInWithPassword({ email, password: "Lambda-123456!" });
    expect(signIn.error).toBeNull();
    const ins = await user.from("photos").insert({ path: `lambda/${Date.now()}.webp`, thumb_path: "lambda/t.webp", width: 1, height: 1 });
    expect(ins.error).not.toBeNull();
    expect((await user.from("messages").select("id")).data ?? []).toEqual([]);
    const { data: isAdmin } = await user.rpc("is_admin");
    expect(isAdmin).toBe(false);
    await db.auth.admin.deleteUser(created.user!.id);
  });
});
