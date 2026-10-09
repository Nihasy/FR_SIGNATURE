import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "@/components/SectionTitle";
import { benefits, collaborations, offers, services, terms } from "@/lib/site";
import videoImg from "../../../../public/images/video.webp";
import terrainImg from "../../../../public/images/terrain.webp";

export const metadata: Metadata = {
  title: "Prestations & tarifs",
  description:
    "Photo et vidéo Auto-Moto : événements, shooting vente et corporate, sorties, reels et reportages. Offres, livrables, tarifs et conditions.",
  alternates: { canonical: "/prestations" },
};

export default function PrestationsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Prestations"
        title={
          <>
            Photo <span className="text-red">&</span> vidéo
          </>
        }
        intro="Des images pensées pour vos réseaux sociaux, vos campagnes et votre communication commerciale — sous une structure légale enregistrée, dans un cadre professionnel et transparent."
      />

      {/* Activités */}
      <section className="container-x grid gap-3 pb-24 md:grid-cols-2">
        {[
          { title: "Photographie", list: services.photo, img: terrainImg, alt: "Préparation d'un shooting automobile en extérieur" },
          { title: "Vidéo", list: services.video, img: videoImg, alt: "Stabilisateur et caméra pour les tournages vidéo" },
        ].map((block, i) => (
          <Reveal key={block.title} delay={i * 120} className="relative flex min-h-[520px] flex-col justify-end overflow-hidden p-8 md:p-10">
            <Image src={block.img} alt={block.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" placeholder="blur" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />
            <div className="relative">
              <p className="eyebrow text-red">{String(i + 1).padStart(2, "0")}</p>
              <h2 className="display-italic mt-4 text-5xl md:text-6xl">{block.title}</h2>
              <ul className="mt-8 space-y-3 border-t border-line pt-6">
                {block.list.map((s) => (
                  <li key={s} className="eyebrow flex items-center gap-3 text-paper/85">
                    <span className="h-1.5 w-1.5 -skew-x-12 bg-red" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </section>

      {/* Offres */}
      <section className="bg-paper text-ink">
        <div className="container-x py-24 md:py-32">
          <SectionTitle
            light
            index="01"
            eyebrow="Offres"
            title="Tarifs"
            aside={<p className="text-sm text-ink/60">Tarifs indicatifs hors taxes (HT). La TVA applicable est ajoutée à la facturation finale, conformément à la réglementation en vigueur.</p>}
          />
          {/* Mobile : fiches empilées */}
          <ul className="mt-10 md:hidden">
            {offers.map((o) => (
              <li key={o.name} className="border-b border-line-dark py-5">
                <p className="eyebrow text-red">{o.kind}</p>
                <p className="display mt-2 text-3xl">{o.name}</p>
                <p className="mt-2 flex items-baseline justify-between gap-4">
                  <span className="text-ink/70">{o.deliverable}</span>
                  <span className="whitespace-nowrap font-semibold">{o.price}</span>
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-12 hidden md:block">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Offres, livrables et tarifs</caption>
              <thead>
                <tr className="border-b-2 border-ink">
                  <th scope="col" className="eyebrow py-4 pr-4 font-semibold">Offre</th>
                  <th scope="col" className="eyebrow py-4 pr-4 font-semibold">Livrable</th>
                  <th scope="col" className="eyebrow py-4 text-right font-semibold">Prix HT</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((o) => (
                  <tr key={o.name} className="border-b border-line-dark align-baseline transition-colors hover:bg-paper-2">
                    <th scope="row" className="py-6 pr-4 font-normal">
                      <span className="eyebrow mr-3 text-red">{o.kind}</span>
                      <span className="display text-2xl md:text-3xl">{o.name}</span>
                    </th>
                    <td className="py-6 pr-4 text-ink/70">{o.deliverable}</td>
                    <td className="whitespace-nowrap py-6 text-right font-semibold">{o.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-8 text-sm text-ink/60">
            Chaque projet commence par un briefing : le devis final dépend du lieu, de la durée et des livrables attendus.
          </p>
        </div>
      </section>

      {/* Collaboration */}
      <section className="container-x py-24 md:py-32">
        <SectionTitle
          index="02"
          eyebrow="Collaboration"
          title="Pour les marques & concessions"
          aside={<p className="text-paper/60">Je souhaite construire des collaborations à long terme avec les concessionnaires et acteurs Auto-Moto à Antananarivo.</p>}
        />
        <div className="mt-12 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {collaborations.map((c, i) => (
            <Reveal key={c.title} className="bg-ink p-8" delay={i * 80}>
              <p className="eyebrow text-red">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="display mt-6 text-3xl">{c.title}</h3>
              <p className="mt-4 text-paper/60">{c.text}</p>
            </Reveal>
          ))}
        </div>
        <div className="mt-20 grid gap-10 md:grid-cols-12">
          <h3 className="display text-4xl md:col-span-4 md:text-5xl">
            Ce que j&apos;apporte à une concession
          </h3>
          <ul className="md:col-span-8">
            {benefits.map((b) => (
              <li key={b.title} className="grid gap-2 border-t border-line py-6 sm:grid-cols-2 sm:gap-8">
                <span className="display text-2xl">{b.title}</span>
                <span className="text-paper/60">{b.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Conditions */}
      <section className="border-t border-line bg-ink-2">
        <div className="container-x py-24 md:py-32">
          <SectionTitle index="03" eyebrow="Cadre" title="Conditions générales" />
          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {terms.map((t) => (
              <div key={t.title}>
                <h3 className="eyebrow text-paper">{t.title}</h3>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-paper/60">
                  {t.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-16 flex flex-wrap gap-3">
            <Link href="/contact" className="btn btn-red">
              Demander un devis <span aria-hidden="true">→</span>
            </Link>
            <Link href="/mentions-legales" className="btn btn-ghost">
              Informations légales
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
