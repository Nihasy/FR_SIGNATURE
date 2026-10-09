import { expect, test, type Page } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, FIXTURES, service, SUPABASE_URL, TAG } from "./helpers";
import { cleanup } from "./global-setup";

test.describe.configure({ mode: "serial" });

async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("E-mail").fill(ADMIN_EMAIL);
  await page.getByLabel("Mot de passe").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
}

test.afterAll(async () => {
  await cleanup();
});

test.describe("Back-office", () => {
  test("accès protégé : redirection vers la connexion et mauvais mot de passe", async ({ page }) => {
    await page.goto("/admin/photos");
    await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fphotos/);
    await page.getByLabel("E-mail").fill(ADMIN_EMAIL);
    await page.getByLabel("Mot de passe").fill("mauvais-mot-de-passe");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByRole("main").getByRole("alert")).toHaveText("E-mail ou mot de passe incorrect.");
    // Bon mot de passe : retour à la page demandée
    await page.getByLabel("Mot de passe").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/admin\/photos$/);
    await expect(page.getByRole("heading", { name: "Photos", exact: true })).toBeVisible();
  });

  test("tableau de bord : chiffres et stockage", async ({ page }) => {
    await login(page);
    const n = Number(await page.getByTestId("stat-Photos").textContent());
    expect(n).toBeGreaterThanOrEqual(83);
    await expect(page.getByRole("progressbar", { name: "Stockage utilisé" })).toBeVisible();
    await expect(page.getByText(/\/ 1 Go/)).toBeVisible();
  });

  test("import de photos : redimensionnement, WebP, orientation, visible sur le site", async ({ page }) => {
    await login(page);
    await page.goto("/admin/photos");
    await page.getByRole("button", { name: "+ Importer" }).click();
    await page.getByLabel("Discipline").first().selectOption("automobile");
    await page.getByTestId("upload-input").setInputFiles([`${FIXTURES}/test-1.jpg`, `${FIXTURES}/test-2.jpg`, `${FIXTURES}/rotated.jpg`]);
    await expect(page.getByText("3 / 3 importées")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/3 photos importées/)).toBeVisible();

    const db = service();
    const { data: rows } = await db.from("photos").select("*").in("original_name", ["test-1.jpg", "test-2.jpg", "rotated.jpg"]);
    expect(rows).toHaveLength(3);
    const t1 = rows!.find((r) => r.original_name === "test-1.jpg")!;
    expect(Math.max(t1.width, t1.height)).toBe(2400);
    expect(t1).toMatchObject({ width: 2400, height: 1600, category: "automobile", published: true });
    expect(t1.path).toMatch(/^uploads\/.+\/large\.webp$/);
    expect(t1.blur).toMatch(/^data:image\/jpeg;base64,/);
    // Orientation EXIF appliquée : 2400×1600 tourné → portrait
    const rot = rows!.find((r) => r.original_name === "rotated.jpg")!;
    expect(rot.height).toBeGreaterThan(rot.width);
    // Fichiers servis publiquement, en WebP, avec miniature plus légère
    const large = await page.request.get(`${SUPABASE_URL}/storage/v1/object/public/photos/${t1.path}`);
    const thumb = await page.request.get(`${SUPABASE_URL}/storage/v1/object/public/photos/${t1.thumb_path}`);
    expect(large.headers()["content-type"]).toBe("image/webp");
    expect((await thumb.body()).length).toBeLessThan((await large.body()).length);

    // Donner un titre puis vérifier sur le site public (cache invalidé)
    await page.getByRole("button", { name: /Modifier (test-1\.jpg|Test 1)/ }).first().click();
    const editor = page.getByRole("dialog", { name: "Modifier la photo" });
    await editor.getByLabel("Titre").fill(`${TAG} Coupé rouge`);
    await editor.getByLabel(/texte alternatif/).fill("Coupé rouge photographié en studio");
    await editor.getByText("Sélection « Images signature » (accueil)").click();
    await editor.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Photo enregistrée.")).toBeVisible();

    await page.goto("/portfolio?cat=automobile");
    await expect(page.getByRole("button", { name: `Agrandir : ${TAG} Coupé rouge` })).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("button", { name: `Agrandir : ${TAG} Coupé rouge` })).toBeVisible();
  });

  test("dépublier retire la photo du site, republier la remet", async ({ page }) => {
    await login(page);
    await page.goto("/admin/photos");
    await page.getByRole("searchbox", { name: "Rechercher" }).fill(`${TAG} Coupé`);
    await expect(page.getByTestId("photo-card")).toHaveCount(1);
    await page.getByTestId("photo-card").getByRole("checkbox", { name: "Sélectionner" }).check();
    await page.getByRole("button", { name: "Dépublier" }).click();
    await expect(page.getByText(/passées en brouillon/)).toBeVisible();
    await expect(page.getByTestId("photo-card").getByText("Brouillon")).toBeVisible();

    await page.goto("/portfolio");
    await expect(page.getByRole("button", { name: `Agrandir : ${TAG} Coupé rouge` })).toHaveCount(0);

    await page.goto("/admin/photos");
    await page.getByRole("searchbox", { name: "Rechercher" }).fill(`${TAG} Coupé`);
    await page.getByTestId("photo-card").getByRole("checkbox", { name: "Sélectionner" }).check();
    await page.getByRole("button", { name: "Publier", exact: true }).click();
    await expect(page.getByText(/publiées\./)).toBeVisible();
    await page.goto("/portfolio");
    await expect(page.getByRole("button", { name: `Agrandir : ${TAG} Coupé rouge` })).toBeVisible();
  });

  test("séries : création, ajout, ordre, couverture, publication", async ({ page }) => {
    await login(page);
    await page.goto("/admin/series");
    await page.getByLabel("Titre de la nouvelle série").fill(`${TAG} Rallye de test`);
    await page.getByLabel("Discipline").selectOption("competition");
    await page.getByRole("button", { name: "Créer la série" }).click();
    await expect(page).toHaveURL(/\/admin\/series\/edit\?id=/);
    await expect(page.getByRole("heading", { name: `${TAG} Rallye de test` })).toBeVisible();

    // Import direct dans la série
    await page.getByTestId("upload-input").setInputFiles([`${FIXTURES}/test-3.jpg`]);
    await expect(page.getByText("1 / 1 importée")).toBeVisible({ timeout: 30_000 });
    // Ajout depuis la bibliothèque
    await page.getByRole("button", { name: "+ Ajouter depuis la bibliothèque" }).click();
    const picker = page.getByRole("dialog", { name: "Ajouter des photos" });
    await picker.getByRole("button", { name: `${TAG} Coupé rouge` }).click();
    await picker.getByRole("button", { name: "Ajouter", exact: true }).click();
    await expect(page.getByTestId("album-photo")).toHaveCount(2);

    const ids = async () => page.getByTestId("album-photo").evaluateAll((els) => els.map((e) => e.getAttribute("data-id")));
    const before = await ids();
    // Réordonner au clavier (dnd-kit) : la 1re photo passe en 2e position
    const handle = page.getByRole("button", { name: "Déplacer la photo 1" });
    await handle.focus();
    await page.keyboard.press("Space");
    await page.waitForTimeout(200);
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(400);
    await page.keyboard.press("Space");
    await expect.poll(ids).toEqual([before[1], before[0]]);

    // Couverture = photo actuellement en 2e position
    await page.getByTestId("album-photo").nth(1).getByRole("button", { name: "Définir comme couverture" }).click();
    await expect(page.getByText("Couverture mise à jour.")).toBeVisible();

    await page.getByLabel("Sous-titre (ex. : Compétition moto)").fill("Test automatisé");
    await page.getByLabel("Texte de présentation").fill("Une série créée par les tests de bout en bout.");
    await page.getByText("Série en ligne").click();
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Série enregistrée.")).toBeVisible();

    const { data: album } = await service().from("albums").select("slug,cover_photo_id").like("title", `${TAG} Rallye%`).single();
    expect(album!.cover_photo_id).toBe(before[0]);
    const { data: order } = await service().from("photos").select("id,sort_order").in("id", before as string[]).order("sort_order");
    expect(order!.map((o) => o.id)).toEqual([before[1], before[0]]);

    // Côté public
    await page.goto(`/series/${album!.slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(`${TAG} Rallye de test`);
    await expect(page.getByText("Une série créée par les tests")).toBeVisible();
    await expect(page.locator("article ul button[aria-label^='Agrandir']")).toHaveCount(2);
    await page.goto("/series");
    await expect(page.getByRole("link", { name: new RegExp(`${TAG} Rallye de test`) })).toBeVisible();

    // Supprimer la série : les photos restent dans la bibliothèque
    await page.goto("/admin/series");
    await page.getByRole("link", { name: new RegExp(`${TAG} Rallye de test`) }).click();
    await page.getByRole("button", { name: "Supprimer la série" }).click();
    await page.getByRole("button", { name: "Oui" }).click();
    await expect(page).toHaveURL(/\/admin\/series$/);
    const { count } = await service().from("photos").select("id", { count: "exact", head: true }).in("id", before as string[]);
    expect(count).toBe(2);
    const res = await page.request.get(`/series/${album!.slug}`);
    expect(res.status()).toBe(404);
  });

  test("messages : lecture, marquage et suppression", async ({ page }) => {
    await service().from("messages").insert({ name: `${TAG} Client`, email: "client@exemple.com", service: "Vidéo · reel", message: "Bonjour, je voudrais un reel pour notre lancement." });
    await login(page);
    await expect(page.getByRole("link", { name: /Messages \d+/ })).toBeVisible();
    await page.goto("/admin/messages");
    const row = page.getByRole("button", { name: new RegExp(`${TAG} Client`) });
    await row.click();
    await expect(page.getByText("Bonjour, je voudrais un reel pour notre lancement.").last()).toBeVisible();
    await expect(page.getByRole("link", { name: "Répondre par e-mail" })).toHaveAttribute("href", /^mailto:client@exemple\.com/);
    await expect.poll(async () => (await service().from("messages").select("read").eq("name", `${TAG} Client`).single()).data!.read).toBe(true);
    await page.getByRole("button", { name: "Supprimer" }).click();
    await page.getByRole("button", { name: "Oui" }).click();
    await expect(row).toHaveCount(0);
  });

  test("réglages : un lien Instagram apparaît sur le site", async ({ page }) => {
    await login(page);
    await page.goto("/admin/reglages");
    // Saisie sans https:// : complétée automatiquement
    await page.getByLabel("Lien Instagram").fill("www.instagram.com/frsignatureauto");
    await page.getByRole("button", { name: "Enregistrer" }).first().click();
    await expect(page.getByText("Réglages enregistrés.")).toBeVisible();
    await expect(page.getByLabel("Lien Instagram")).toHaveValue("https://www.instagram.com/frsignatureauto");
    await page.goto("/contact");
    await expect(page.getByRole("link", { name: "Instagram" }).first()).toHaveAttribute("href", "https://www.instagram.com/frsignatureauto");

    // Disciplines : ajout et renommage visibles dans les filtres
    await page.goto("/admin/reglages");
    await page.getByLabel("Nouvelle discipline").fill(`${TAG} Drift`);
    await page.getByRole("button", { name: "Ajouter" }).click();
    await expect(page.locator(`input[value="${TAG} Drift"]`)).toBeVisible();
  });

  test("suppression d'une photo : base et fichiers effacés", async ({ page }) => {
    const { data: photo } = await service().from("photos").select("id,path,thumb_path").eq("original_name", "test-2.jpg").single();
    await login(page);
    await page.goto("/admin/photos");
    await page.getByRole("searchbox", { name: "Rechercher" }).fill("test-2.jpg");
    await expect(page.getByTestId("photo-card")).toHaveCount(1);
    await page.getByTestId("photo-card").getByRole("button").first().click();
    const editor = page.getByRole("dialog", { name: "Modifier la photo" });
    await editor.getByRole("button", { name: "Supprimer" }).click();
    await editor.getByRole("button", { name: "Oui" }).click();
    await expect(page.getByText("Photo supprimée.")).toBeVisible();
    const { data } = await service().from("photos").select("id").eq("id", photo!.id);
    expect(data).toEqual([]);
    const file = await page.request.get(`${SUPABASE_URL}/storage/v1/object/public/photos/${photo!.path}`);
    expect(file.ok()).toBe(false);
  });

  test("déconnexion", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Se déconnecter" }).first().click();
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
