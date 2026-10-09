import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlbumGallery } from "@/components/AlbumGallery";
import { Img } from "@/components/Img";
import { getAlbum, getAlbums, getCategories } from "@/lib/data";
import { photoSrc } from "@/lib/images";

const PLACEHOLDER = "__aucune-serie__";

export async function generateStaticParams() {
  const albums = await getAlbums();
  // Cache Components exige au moins un paramètre ; le repli est traité par notFound().
  return albums.length ? albums.map((a) => ({ slug: a.slug })) : [{ slug: PLACEHOLDER }];
}

export async function generateMetadata({ params }: PageProps<"/series/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const data = await getAlbum(slug);
  if (!data) return { title: "Série introuvable" };
  const { album } = data;
  return {
    title: album.title,
    description: album.description ?? `${album.title} — série photo FR Signature Auto.`,
    alternates: { canonical: `/series/${album.slug}` },
    openGraph: album.cover ? { images: [{ url: photoSrc(album.cover).large, width: album.cover.width, height: album.cover.height }] } : undefined,
  };
}

export default async function AlbumPage({ params }: PageProps<"/series/[slug]">) {
  const { slug } = await params;
  const [data, albums, categories] = await Promise.all([getAlbum(slug), getAlbums(), getCategories()]);
  if (!data) notFound();
  const { album, photos } = data;
  const category = categories.find((c) => c.slug === album.category);
  const i = albums.findIndex((a) => a.id === album.id);
  const next = albums.length > 1 ? albums[(i + 1) % albums.length] : null;
  const date = album.event_date
    ? new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(album.event_date))
    : null;

  return (
    <article>
      <header className="relative h-[85svh] min-h-[520px] overflow-hidden">
        {album.cover && <Img photo={album.cover} variant="large" sizes="100vw" priority />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/50" />
        <div className="container-x relative flex h-full flex-col justify-end pb-12 md:pb-16">
          <Link href="/series" className="eyebrow mb-8 text-paper/70 hover:text-paper">
            ← Toutes les séries
          </Link>
          {album.subtitle && <p className="eyebrow mb-4 text-red">{album.subtitle}</p>}
          <h1 className="display max-w-5xl text-6xl sm:text-8xl lg:text-[8rem]">{album.title}</h1>
        </div>
      </header>

      <div className="container-x grid gap-10 py-16 md:grid-cols-12 md:py-24">
        <dl className="grid grid-cols-2 gap-6 md:col-span-4 md:grid-cols-1">
          {category && (
            <div>
              <dt className="eyebrow text-paper/40">Discipline</dt>
              <dd className="mt-2">{category.name}</dd>
            </div>
          )}
          {album.location && (
            <div>
              <dt className="eyebrow text-paper/40">Lieu</dt>
              <dd className="mt-2">{album.location}</dd>
            </div>
          )}
          {date && (
            <div>
              <dt className="eyebrow text-paper/40">Date</dt>
              <dd className="mt-2 capitalize">{date}</dd>
            </div>
          )}
          <div>
            <dt className="eyebrow text-paper/40">Images</dt>
            <dd className="mt-2">{photos.length}</dd>
          </div>
        </dl>
        {album.description && (
          <p className="text-xl leading-relaxed text-paper/80 md:col-span-8 md:text-2xl">{album.description}</p>
        )}
      </div>

      <div className="container-x pb-24">
        {photos.length ? (
          <AlbumGallery photos={photos} albumTitle={album.title} />
        ) : (
          <p className="text-paper/50">Les photos de cette série arrivent bientôt.</p>
        )}
      </div>

      {next && next.id !== album.id && (
        <Link href={`/series/${next.slug}`} className="group relative block h-[50svh] overflow-hidden border-t border-line">
          {next.cover && (
            <Img photo={next.cover} variant="large" sizes="100vw" className="opacity-50 transition-opacity duration-700 group-hover:opacity-80" />
          )}
          <div className="container-x relative flex h-full flex-col justify-center">
            <p className="eyebrow text-paper/70">Série suivante</p>
            <p className="display mt-4 text-5xl sm:text-7xl lg:text-8xl">
              {next.title} <span className="text-red">→</span>
            </p>
          </div>
        </Link>
      )}
    </article>
  );
}
