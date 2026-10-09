import Link from "next/link";
import { AlbumCard } from "@/components/AlbumCard";
import { FeaturedGrid } from "@/components/FeaturedGrid";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { Img } from "@/components/Img";
import { Reveal } from "@/components/Reveal";
import { SectionTitle } from "@/components/SectionTitle";
import { getAlbums, getCategories, getFeaturedPhotos, getHeroPhotos, getPublishedPhotos, getSettings } from "@/lib/data";
import { SITE_URL } from "@/lib/env";
import { approach, brand, pillars, references } from "@/lib/site";

export default async function HomePage() {
  const [hero, featured, albums, categories, photos, settings] = await Promise.all([
    getHeroPhotos(),
    getFeaturedPhotos(12),
    getAlbums(),
    getCategories(),
    getPublishedPhotos(),
    getSettings(),
  ]);
  const heroIds = new Set(hero.map((p) => p.id));
  const selection = featured.filter((p) => !heroIds.has(p.id)).slice(0, 6);
  // Photos des piliers : ni dans le diaporama, ni dans la sélection, si possible d'une discipline différente.
  const used = new Set([...heroIds, ...selection.map((p) => p.id)]);
  const pool = photos.filter((p) => !used.has(p.id));
  const pillarPhotos: typeof photos = [];
  for (const p of [...pool.filter((x) => x.featured), ...pool]) {
    if (pillarPhotos.length === 3) break;
    if (!pillarPhotos.some((x) => x.id === p.id || x.category === p.category)) pillarPhotos.push(p);
  }
  const categoryCover = (slug: string) => photos.find((p) => p.category === slug && p.featured) ?? photos.find((p) => p.category === slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: brand.name,
    founder: { "@type": "Person", name: brand.owner, jobTitle: brand.role },
    url: SITE_URL,
    email: settings.email ?? undefined,
    telephone: settings.phone ?? undefined,
    address: { "@type": "PostalAddress", addressLocality: "Antananarivo", addressCountry: "MG" },
    areaServed: "Madagascar",
    description: brand.mission,
    sameAs: [settings.instagram_url, settings.facebook_url, settings.linkedin_url].filter(Boolean),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {hero.length > 0 ? (
        <HeroSlideshow photos={hero} />
      ) : (
        <section className="container-x flex min-h-[80svh] items-end pb-16 pt-32">
          <h1 className="display text-[14vw] lg:text-[8vw]">
            La passion racontée <span className="text-red">en images.</span>
          </h1>
        </section>
      )}

      {/* Manifeste */}
      <section className="bg-paper text-ink">
        <div className="container-x grid gap-12 py-24 md:grid-cols-12 md:py-36">
          <Reveal className="md:col-span-4">
            <p className="eyebrow flex items-center gap-3 text-ink/60">
              <span className="text-red">01</span> Introduction
            </p>
            <p className="eyebrow mt-6 text-ink/50">
              {brand.values.join(" · ")}
            </p>
          </Reveal>
          <Reveal className="md:col-span-8" delay={120}>
            <h2 className="display text-5xl sm:text-6xl lg:text-8xl">
              Montrer plus
              <br />
              qu&apos;un véhicule.
            </h2>
            <p className="mt-10 max-w-2xl text-lg leading-relaxed text-ink/75 md:text-xl">{brand.mission}</p>
            <p className="mt-6 max-w-2xl leading-relaxed text-ink/60">
              Photographe malgache spécialisé dans l&apos;automobile, la moto, l&apos;événementiel et le reportage, je raconte le
              caractère d&apos;une machine, son environnement et le moment qui l&apos;entoure — avec des images propres, naturelles et
              prêtes pour la communication digitale des marques.
            </p>
            <Link href="/a-propos" className="btn btn-ghost mt-10">
              Découvrir l&apos;approche
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Sélection */}
      {selection.length > 0 && (
        <section className="container-x py-24 md:py-32">
          <SectionTitle
            index="02"
            eyebrow="Sélection"
            title={
              <>
                Images <span className="text-red">signature</span>
              </>
            }
            aside={
              <Link href="/portfolio" className="eyebrow link-underline text-paper/80 hover:text-paper">
                Tout le portfolio ({photos.length}) →
              </Link>
            }
          />
          <div className="mt-12">
            <FeaturedGrid photos={selection} />
          </div>
        </section>
      )}

      {/* Séries */}
      {albums.length > 0 && (
        <section className="py-24 md:py-32">
          <div className="container-x">
            <SectionTitle
              index="03"
              eyebrow="Séries"
              title="Les histoires"
              aside={
                <p className="text-paper/60">
                  Chaque série raconte un moment : une course, une sortie, un lancement. Le produit, l&apos;expérience, l&apos;histoire.
                </p>
              }
            />
          </div>
          <div className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 sm:scroll-px-8 sm:px-8 lg:scroll-px-12 lg:px-12">
            {albums.map((album, i) => (
              <AlbumCard
                key={album.id}
                album={album}
                index={i}
                className="w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-[30vw]"
              />
            ))}
            <Link
              href="/series"
              className="flex w-[60vw] shrink-0 snap-start items-center justify-center border border-line sm:w-[30vw] lg:w-[20vw]"
            >
              <span className="display text-center text-4xl">
                Toutes les
                <br />
                séries <span className="text-red">→</span>
              </span>
            </Link>
          </div>
        </section>
      )}

      {/* Piliers */}
      <section className="border-t border-line">
        <div className="container-x py-24 md:py-32">
          <SectionTitle index="04" eyebrow="Valeurs" title="Ce qui guide chaque image" />
          <div className="mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
            {pillars.map((pillar, i) => (
              <Reveal key={pillar.title} delay={i * 120}>
                <div className="relative aspect-[4/5] overflow-hidden bg-ink-3">
                  {pillarPhotos[i] && <Img photo={pillarPhotos[i]} sizes="(min-width: 768px) 33vw, 100vw" />}
                  <span className="display absolute bottom-3 left-4 text-7xl text-paper/90 md:text-8xl">{String(i + 1).padStart(2, "0")}</span>
                </div>
                <h3 className="display-italic mt-6 text-4xl tracking-[0.04em]">{pillar.title}</h3>
                <p className="mt-3 max-w-sm leading-relaxed text-paper/65">{pillar.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Disciplines */}
      <section className="bg-ink-2">
        <div className="container-x py-24 md:py-32">
          <SectionTitle index="05" eyebrow="Disciplines" title="Terrains de jeu" />
          <ul className="mt-12 border-t border-line">
            {categories
              .filter((c) => c.photo_count > 0)
              .map((cat) => {
                const cover = categoryCover(cat.slug);
                return (
                  <li key={cat.slug} className="border-b border-line">
                    <Link href={`/portfolio?cat=${cat.slug}`} className="group relative flex items-center justify-between gap-6 py-6 md:py-8">
                      <span className="flex items-baseline gap-6">
                        <span className="eyebrow w-10 text-paper/40">{String(cat.photo_count).padStart(2, "0")}</span>
                        <span className="display text-4xl transition-colors duration-300 group-hover:text-red sm:text-6xl lg:text-7xl">
                          {cat.name}
                        </span>
                      </span>
                      <span className="hidden max-w-xs text-right text-sm text-paper/50 md:block">{cat.description}</span>
                      {cover && (
                        <span className="pointer-events-none absolute right-[22%] top-1/2 hidden h-40 w-60 -translate-y-1/2 rotate-[-3deg] overflow-hidden opacity-0 transition-all duration-500 group-hover:rotate-0 group-hover:opacity-100 lg:block">
                          <Img photo={cover} sizes="240px" />
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      </section>

      {/* Approche */}
      <section className="container-x py-24 md:py-32">
        <SectionTitle
          index="06"
          eyebrow="Approche"
          title={
            <>
              Trois éléments,
              <br />
              une signature
            </>
          }
        />
        <div className="mt-12 grid gap-px bg-line md:grid-cols-3">
          {approach.map((a, i) => (
            <Reveal key={a.title} className="bg-ink p-8 md:p-10" delay={i * 100}>
              <p className="eyebrow text-red">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="display mt-6 text-4xl md:text-5xl">{a.title}</h3>
              <p className="mt-6 text-paper/60">{a.keywords.join(" · ")}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Références */}
      <section className="overflow-hidden border-y border-line py-12">
        <p className="eyebrow container-x mb-8 text-paper/50">Ils m&apos;ont fait confiance</p>
        <div className="flex w-max marquee">
          {[0, 1].map((k) => (
            <ul key={k} className="flex shrink-0 items-center" aria-hidden={k === 1}>
              {[...references.institutions, ...references.autoMoto].map((r) => (
                <li key={r.name} className="display-italic flex items-center whitespace-nowrap px-8 text-3xl text-paper/80 md:text-5xl">
                  {r.name}
                  <span className="ml-16 inline-block h-2 w-2 -skew-x-12 bg-red" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </section>

      {/* Appel à l'action */}
      <section className="container-x py-28 md:py-40">
        <Reveal className="mx-auto max-w-5xl text-center">
          <p className="eyebrow text-paper/50">Collaboration</p>
          <h2 className="display mt-6 text-5xl sm:text-7xl lg:text-8xl">
            Construisons ensemble une image forte autour de <span className="text-red">vos véhicules.</span>
          </h2>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="btn btn-red">
              Démarrer un projet <span aria-hidden="true">→</span>
            </Link>
            <Link href="/prestations" className="btn btn-ghost">
              Prestations & tarifs
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
