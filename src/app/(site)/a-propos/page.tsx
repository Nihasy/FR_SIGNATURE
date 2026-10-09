import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "@/components/SectionTitle";
import { approach, brand, expertise, gear, references } from "@/lib/site";
import atelierImg from "../../../../public/images/atelier.webp";
import reportageImg from "../../../../public/images/reportage.webp";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Faniry Raoilison, photographe et créateur de contenu Auto-Moto à Antananarivo. Parcours, approche, expertises, références et matériel.",
  alternates: { canonical: "/a-propos" },
};

const skills = [
  "Photographie automobile & moto",
  "Photographie événementielle",
  "Reportage",
  "Photographie d'action",
  "Storytelling visuel",
  "Création de contenu digital",
  "Retouche photographique",
  "Organisation de shooting",
  "Communication réseaux sociaux",
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow={brand.role}
        title={
          <>
            Faniry
            <br />
            <span className="text-red">Raoilison</span>
          </>
        }
      />

      <section className="container-x grid gap-12 pb-24 md:grid-cols-12 md:pb-32">
        <Reveal className="relative aspect-[3/4] overflow-hidden md:col-span-5">
          <Image
            src={atelierImg}
            alt="Sur le terrain : appareil Fujifilm en main face à une sportive"
            fill
            sizes="(min-width: 768px) 40vw, 100vw"
            className="object-cover"
            placeholder="blur"
            priority
          />
        </Reveal>
        <Reveal className="flex flex-col justify-end md:col-span-7" delay={120}>
          <p className="display text-4xl leading-[0.95] md:text-6xl">
            Photographe malgache spécialisé dans l&apos;automobile, la moto, l&apos;événementiel et le reportage.
          </p>
          <div className="mt-10 grid gap-6 text-lg leading-relaxed text-paper/70 lg:grid-cols-2">
            <p>
              À travers <strong className="text-paper">FR Signature Auto</strong>, je développe un univers dédié à l&apos;automobile
              et à la moto à Madagascar : les véhicules, les pilotes, les passionnés et les événements, mis en valeur par une
              photographie élégante, naturelle et dynamique.
            </p>
            <p>
              Mon approche ne consiste pas uniquement à photographier un véhicule : je cherche à raconter son caractère, son
              environnement et le moment qui l&apos;entoure, avec des images adaptées à la communication digitale des marques.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Approche */}
      <section className="bg-paper text-ink">
        <div className="container-x py-24 md:py-32">
          <SectionTitle light index="01" eyebrow="Approche" title="Montrer plus qu'un véhicule" />
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {approach.map((a, i) => (
              <Reveal key={a.title} delay={i * 100}>
                <p className="display text-8xl text-red">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="display mt-4 text-4xl">{a.title}</h3>
                <p className="mt-4 text-ink/65">{a.keywords.join(" · ")}</p>
              </Reveal>
            ))}
          </div>
          <p className="mt-16 max-w-3xl text-lg leading-relaxed text-ink/70">
            L&apos;objectif : produire des images utilisables aussi bien pour les réseaux sociaux que pour la communication
            commerciale et événementielle.
          </p>
        </div>
      </section>

      {/* Expertises */}
      <section className="container-x py-24 md:py-32">
        <SectionTitle index="02" eyebrow="Expertises" title="Domaines" />
        <div className="mt-12 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {expertise.map((e, i) => (
            <Reveal key={e.title} className="bg-ink p-8" delay={i * 80}>
              <h3 className="display text-3xl">{e.title}</h3>
              <ul className="mt-6 space-y-2 text-paper/60">
                {e.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Références */}
      <section className="border-t border-line bg-ink-2">
        <div className="container-x grid gap-16 py-24 md:grid-cols-2 md:py-32">
          <div>
            <SectionTitle index="03" eyebrow="Expériences" title="Institutions & entreprises" />
            <ul className="mt-10">
              {references.institutions.map((r) => (
                <li key={r.name} className="flex flex-col justify-between gap-1 border-b border-line py-5 sm:flex-row sm:items-baseline">
                  <span className="display text-2xl md:text-3xl">{r.name}</span>
                  <span className="text-sm text-paper/50">{r.scope}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionTitle index="04" eyebrow="Projets Auto-Moto" title="Courses & communautés" />
            <ul className="mt-10">
              {references.autoMoto.map((r) => (
                <li key={r.name} className="flex flex-col justify-between gap-1 border-b border-line py-5 sm:flex-row sm:items-baseline">
                  <span className="display text-2xl md:text-3xl">{r.name}</span>
                  <span className="text-sm text-paper/50">{r.scope}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-paper/60">
              Ces expériences ont forgé une approche fondée sur la fiabilité, l&apos;adaptation à chaque environnement et la qualité de
              livraison.
            </p>
          </div>
        </div>
      </section>

      {/* Matériel & compétences */}
      <section className="container-x grid gap-12 py-24 md:grid-cols-12 md:py-32">
        <Reveal className="relative aspect-[3/2] overflow-hidden md:col-span-7">
          <Image src={reportageImg} alt="Reportage lors d'un rassemblement moto" fill sizes="(min-width: 768px) 58vw, 100vw" className="object-cover" placeholder="blur" />
        </Reveal>
        <div className="md:col-span-5">
          <p className="eyebrow text-paper/50">Matériel</p>
          <p className="display mt-4 text-5xl">{gear.body}</p>
          <p className="mt-3 text-paper/60">Objectifs {gear.lenses.join(" · ")} — équipement complémentaire selon les besoins de la production.</p>
          <p className="eyebrow mt-12 text-paper/50">Formation</p>
          <p className="mt-3 text-paper/80">Marketing & Commerce International — ACEEM Manakambahiny, Antananarivo</p>
          <p className="eyebrow mt-12 text-paper/50">Compétences</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {skills.map((s) => (
              <li key={s} className="border border-line px-3 py-1.5 text-sm text-paper/75">
                {s}
              </li>
            ))}
          </ul>
          <Link href="/contact" className="btn btn-red mt-12">
            Travaillons ensemble <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
