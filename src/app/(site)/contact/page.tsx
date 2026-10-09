import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { SocialLinks, whatsappHref } from "@/components/SocialLinks";
import { getSettings } from "@/lib/data";
import { brand } from "@/lib/site";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Parlons de votre projet photo ou vidéo Auto-Moto : shooting, événement, course, collaboration avec une marque ou une concession.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getSettings();
  return (
    <>
      <PageHeader
        eyebrow="Contact"
        title={
          <>
            Parlons de
            <br />
            votre <span className="text-red">projet</span>
          </>
        }
        intro={settings.availability ?? undefined}
      />
      <section className="container-x grid gap-16 pb-24 md:grid-cols-12 md:pb-32">
        <div className="md:col-span-7">
          <ContactForm />
        </div>
        <aside className="md:col-span-4 md:col-start-9">
          <ul className="space-y-8">
            {settings.email && (
              <li>
                <p className="eyebrow text-paper/40">E-mail</p>
                <a href={`mailto:${settings.email}`} className="link-underline mt-2 inline-block break-all text-xl font-bold md:text-2xl">
                  {settings.email}
                </a>
              </li>
            )}
            {settings.phone && (
              <li>
                <p className="eyebrow text-paper/40">Téléphone</p>
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="display link-underline mt-2 inline-block text-2xl md:text-3xl">
                  {settings.phone}
                </a>
              </li>
            )}
            {settings.whatsapp && (
              <li>
                <a href={whatsappHref(settings.whatsapp)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                  Écrire sur WhatsApp
                </a>
              </li>
            )}
            <li>
              <p className="eyebrow text-paper/40">Basé à</p>
              <p className="mt-2 text-lg">{settings.location ?? brand.city}</p>
              <p className="mt-1 text-sm text-paper/50">Déplacements dans tout Madagascar (frais en sus).</p>
            </li>
            <li>
              <SocialLinks settings={settings} />
            </li>
          </ul>
        </aside>
      </section>
    </>
  );
}
