import { expect, test } from "@playwright/test";

test.describe("Mobile", () => {
  test("menu, pas de défilement horizontal, visionneuse au doigt", async ({ page }) => {
    for (const path of ["/", "/portfolio", "/series/rassemblement-custom", "/prestations", "/a-propos", "/contact"]) {
      await page.goto(path);
      const [scroll, width] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
      expect(scroll, `débordement horizontal sur ${path}`).toBeLessThanOrEqual(width);
    }

    await page.goto("/");
    await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    const menu = page.getByRole("navigation", { name: "Navigation mobile" });
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: /Séries/ }).click();
    await expect(page).toHaveURL(/\/series$/);
    await expect(menu).toBeHidden();

    await page.goto("/portfolio");
    await page.locator("main ul button[aria-label^='Agrandir']").first().click();
    const dialog = page.getByRole("dialog", { name: "Visionneuse photo" });
    await expect(dialog.getByText(/^01$/)).toBeVisible();
    await dialog.getByRole("button", { name: "Photo suivante" }).last().click();
    await expect(dialog.getByText(/^02$/)).toBeVisible();
    await dialog.getByRole("button", { name: "Fermer la visionneuse" }).click();
    await expect(dialog).toBeHidden();
  });
});
