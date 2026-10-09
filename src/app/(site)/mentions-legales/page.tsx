import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { getSettings } from "@/lib/data";
import { brand, terms } from "@/lib/site";

export const metadata: Metadata = {
  title: "Mentions légales & conditions",
  alternates: { canonical: "/mentions-legales" },
};

export default async function LegalPage() {
  const settings = await getSettings();
  return (
    <>
      <PageHeader eyebrow="Informations" title="Mentions légales" />
      <div className="container-x grid gap-16 pb-24 md:grid-cols-12">
        <section className="space-y-10 md:col-span-5">
          <div>
            <h2 className="eyebrow text-paper/50">Éditeur</h2>
            <p className="mt-3 text-lg">
              {brand.legal.entity} — {brand.owner}
              <br />
              {settings.location ?? brand.city}
              <br />
              NIF : {brand.legal.nif}
              <br />
              STAT : {brand.legal.stat}
              {settings.email && (
                <>
                  <br />
                  {settings.email}
                </>
              )}
            </p>
          </div>
          <div>
            <h2 className="eyebrow text-paper/50">Hébergement</h2>
            <p className="mt-3 text-paper/70">
              Site hébergé par Vercel Inc. (vercel.com). Images et données hébergées par Supabase (supabase.com).
            </p>
          </div>
          <div>
            <h2 className="eyebrow text-paper/50">Propriété intellectuelle</h2>
            <p className="mt-3 text-paper/70">
              L&apos;ensemble des photographies présentées sur ce site est la propriété de {brand.owner}. Toute reproduction,
              diffusion ou utilisation sans autorisation écrite préalable est interdite.
            </p>
          </div>
          <div>
            <h2 className="eyebrow text-paper/50">Données personnelles</h2>
            <p className="mt-3 text-paper/70">
              Les informations envoyées via le formulaire de contact servent uniquement à répondre à votre demande. Elles ne sont ni
              cédées ni utilisées à des fins commerciales. Vous pouvez demander leur suppression à tout moment par e-mail.
            </p>
          </div>
        </section>
        <section className="md:col-span-6 md:col-start-7">
          <h2 className="display text-4xl">Conditions générales de prestation</h2>
          <div className="mt-8 space-y-8">
            {terms.map((t, i) => (
              <div key={t.title} className="border-t border-line pt-6">
                <h3 className="eyebrow">
                  <span className="mr-3 text-red">{i + 1}.</span>
                  {t.title}
                </h3>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-paper/70">
                  {t.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="text-sm text-paper/50">Les tarifs sont exprimés hors taxes ; la TVA applicable est ajoutée à la facturation finale.</p>
          </div>
        </section>
      </div>
    </>
  );
}
