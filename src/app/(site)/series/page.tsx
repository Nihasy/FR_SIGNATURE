import type { Metadata } from "next";
import { AlbumCard } from "@/components/AlbumCard";
import { PageHeader } from "@/components/PageHeader";
import { Reveal } from "@/components/Reveal";
import { getAlbums } from "@/lib/data";

export const metadata: Metadata = {
  title: "Séries",
  description: "Reportages et séries photo : courses, rassemblements, sorties, showrooms et sportives à Madagascar.",
  alternates: { canonical: "/series" },
};

export default async function SeriesPage() {
  const albums = await getAlbums();
  return (
    <>
      <PageHeader
        eyebrow="Séries"
        title={
          <>
            Les <span className="text-red">histoires</span>
          </>
        }
        intro="Une course, une sortie, un lancement : chaque série raconte un moment complet, du détail au mouvement."
      />
      <div className="container-x pb-24">
        {albums.length ? (
          <ul className="grid gap-x-3 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album, i) => (
              <Reveal as="li" key={album.id} delay={(i % 3) * 100}>
                <AlbumCard album={album} index={i} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
                {album.description && <p className="mt-4 line-clamp-2 max-w-md text-sm text-paper/55">{album.description}</p>}
              </Reveal>
            ))}
          </ul>
        ) : (
          <p className="py-24 text-paper/50">Les premières séries arrivent bientôt.</p>
        )}
      </div>
    </>
  );
}
