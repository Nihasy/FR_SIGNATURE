import { expect, test, type Page } from "@playwright/test";
import { service, TAG } from "./helpers";

function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !/404|favicon/.test(m.text())) errors.push(m.text());
  });
  return errors;
}

test.describe("Site public", () => {
  test("accueil : diaporama, sections et navigation", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/");
    await expect(page).toHaveTitle(/FR Signature Auto/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("La passion");
    await expect(page.getByRole("region", { name: "Photographies à la une" }).locator("img").first()).toBeVisible();
    for (const h of ["Montrer plus", "Images signature", "Les histoires", "Ce qui guide chaque image", "Terrains de jeu", "Trois éléments"]) {
      await expect(page.getByRole("heading", { name: new RegExp(h, "i") })).toBeVisible();
    }
    // JSON-LD présent
    const ld = await page.locator('script[type="application/ld+json"]').textContent();
    expect(JSON.parse(ld!)["@type"]).toBe("ProfessionalService");
    // Le diaporama change de photo seul
    const caption = page.getByRole("region", { name: "Photographies à la une" }).locator("p[aria-live]");
    const first = await caption.textContent();
    await expect(caption).not.toHaveText(first!, { timeout: 10_000 });

    await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Portfolio" }).click();
    await expect(page).toHaveURL(/\/portfolio$/);
    expect(errors).toEqual([]);
  });

  test("portfolio : filtres par discipline et visionneuse", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/portfolio");
    const cards = page.locator("main ul button[aria-label^='Agrandir']");
    const total = await cards.count();
    expect(total).toBeGreaterThan(50);

    await page.getByRole("tab", { name: /^Moto/ }).click();
    await expect(page).toHaveURL(/cat=moto/);
    const moto = await cards.count();
    expect(moto).toBeGreaterThan(0);
    expect(moto).toBeLessThan(total);

    // Lien direct avec filtre
    await page.goto("/portfolio?cat=corporate");
    await expect(page.getByRole("tab", { name: /^Corporate/ })).toHaveAttribute("aria-selected", "true");

    await cards.first().click();
    const dialog = page.getByRole("dialog", { name: "Visionneuse photo" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(/^01$/)).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(dialog.getByText(/^02$/)).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(dialog.getByText(/^01$/)).toBeVisible();
    await expect(dialog.locator("img").last()).toHaveJSProperty("complete", true);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    expect(errors).toEqual([]);
  });

  test("séries : liste, page de série et série suivante", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/series");
    const links = page.locator("main a[href^='/series/']");
    expect(await links.count()).toBeGreaterThanOrEqual(7);
    await page.locator("a[href='/series/motocross-terre-rouge']").first().click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Motocross/);
    await expect(page.getByText("Compétition", { exact: true }).first()).toBeVisible();
    const photos = page.locator("article ul button[aria-label^='Agrandir']");
    await expect(photos).toHaveCount(9);
    await expect(page.getByText("Série suivante")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("une série inconnue renvoie la page 404", async ({ page }) => {
    await page.goto("/series/n-existe-pas");
    await expect(page.getByRole("heading", { name: "Hors piste." })).toBeVisible();
    const res = await page.request.get("/page-inexistante");
    expect(res.status()).toBe(404);
  });

  test("prestations : offres et conditions du dossier", async ({ page }) => {
    await page.goto("/prestations");
    const table = page.getByRole("table");
    await expect(table.getByRole("row")).toHaveCount(7);
    await expect(table).toContainText("650 000 Ar / jour");
    await expect(table).toContainText("1 200 000 Ar");
    await expect(page.getByText(/Acompte de 50 %/)).toBeVisible();
    await expect(page.getByText(/hors taxes/).first()).toBeVisible();
  });

  test("à propos et mentions légales reprennent les informations du dossier", async ({ page }) => {
    await page.goto("/a-propos");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Raoilison");
    await expect(page.getByText("Fujifilm X-T4")).toBeVisible();
    await expect(page.getByText("UNESCO")).toBeVisible();
    await page.goto("/mentions-legales");
    await expect(page.getByText(/301 963 7117/).first()).toBeVisible();
    await expect(page.getByText(/73101 11 2026 0 03784/).first()).toBeVisible();
  });

  test("contact : validation puis envoi enregistré en base", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("main").getByRole("link", { name: "fraoilison@gmail.com" })).toBeVisible();
    await page.getByRole("button", { name: /Envoyer/ }).click();
    await expect(page.getByText("Indiquez votre nom.")).toBeVisible();
    await expect(page.getByText("Adresse e-mail invalide.")).toBeVisible();

    const email = `contact-${Date.now()}@exemple.com`;
    await page.getByLabel("Nom *").fill(`${TAG} Concession Test`);
    await page.getByLabel("E-mail *").fill(email);
    await page.getByLabel("Entreprise / marque").fill("Garage Test");
    await page.getByLabel("Type de projet").selectOption("Collaboration long terme");
    await page.getByLabel("Votre projet *").fill("Bonjour, nous souhaitons un shooting de nos nouveaux modèles en showroom.");
    await page.getByRole("button", { name: /Envoyer/ }).click();
    await expect(page.getByText("Merci !")).toBeVisible();

    const { data } = await service().from("messages").select("*").eq("email", email).single();
    expect(data).toMatchObject({ company: "Garage Test", service: "Collaboration long terme", read: false });
  });

  test("SEO : sitemap, robots et métadonnées", async ({ page, request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/series/motocross-terre-rouge");
    expect(sitemap).toContain("/prestations");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /admin");
    await page.goto("/series/sportives-premium");
    await expect(page).toHaveTitle(/Sportives & premium/);
    const og = await page.locator('meta[property="og:image"]').first().getAttribute("content");
    expect(og).toContain("/storage/v1/object/public/photos/");
  });
});
