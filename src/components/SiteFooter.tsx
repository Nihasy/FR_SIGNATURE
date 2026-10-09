import Link from "next/link";
import { getSettings } from "@/lib/data";
import { brand, nav } from "@/lib/site";
import { Logo } from "./Logo";
import { SocialLinks } from "./SocialLinks";

export async function SiteFooter() {
  const settings = await getSettings();
  return (
    <footer className="border-t border-line bg-ink">
      <div className="container-x py-16 md:py-24">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo className="text-2xl" />
            <p className="mt-6 max-w-sm text-paper/60">{brand.tagline}</p>
            <p className="eyebrow mt-8 text-paper/40">Passion · Authenticité · Qualité</p>
          </div>
          <div className="md:col-span-3">
            <p className="eyebrow mb-5 text-paper/40">Navigation</p>
            <ul className="space-y-3">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="link-underline text-paper/80 hover:text-paper">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-4">
            <p className="eyebrow mb-5 text-paper/40">Contact</p>
            <ul className="space-y-3 text-paper/80">
              {settings.email && (
                <li>
                  <a className="link-underline hover:text-paper" href={`mailto:${settings.email}`}>
                    {settings.email}
                  </a>
                </li>
              )}
              {settings.phone && (
                <li>
                  <a className="link-underline hover:text-paper" href={`tel:${settings.phone.replace(/\s/g, "")}`}>
                    {settings.phone}
                  </a>
                </li>
              )}
              <li>{settings.location ?? brand.city}</li>
            </ul>
            <SocialLinks settings={settings} className="mt-6" />
          </div>
        </div>
        <div className="mt-16 flex flex-col gap-3 border-t border-line pt-6 text-xs text-paper/40 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {brand.owner} · {brand.legal.entity} — NIF {brand.legal.nif} · STAT {brand.legal.stat}
          </p>
          <Link href="/mentions-legales" className="hover:text-paper">
            Mentions légales & conditions
          </Link>
        </div>
      </div>
    </footer>
  );
}
