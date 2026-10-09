// Captures d'écran de contrôle : node scripts/shots.mjs <baseUrl> <outDir> [chemins...]
import { chromium } from "@playwright/test";
const [base, out, ...paths] = process.argv.slice(2);
const browser = await chromium.launch();
for (const [name, viewport] of [["desktop", { width: 1440, height: 900 }], ["mobile", { width: 390, height: 844 }]]) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  for (const p of paths) {
    await page.goto(base + p, { waitUntil: "networkidle" });
    // déclenche les apparitions au défilement
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 700) { await page.mouse.wheel(0, 700); await page.waitForTimeout(120); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(900);
    const file = `${out}/${name}${p.replace(/[/?=]/g, "_") || "_home"}.png`;
    await page.screenshot({ path: file, fullPage: true });
    const w = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    console.log(name, p, "overflowX:", w[0] > w[1] ? `OUI ${w}` : "non");
  }
  if (errors.length) console.log(name, "ERREURS:", [...new Set(errors)].join("\n"));
  await page.close();
}
await browser.close();
