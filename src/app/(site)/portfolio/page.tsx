import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { PortfolioGallery } from "@/components/PortfolioGallery";
import { getCategories, getPublishedPhotos } from "@/lib/data";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Photographies automobile, moto, compétition, sorties, événementiel et corporate réalisées par FR Signature Auto à Madagascar.",
  alternates: { canonical: "/portfolio" },
};

export default async function PortfolioPage() {
  const [photos, categories] = await Promise.all([getPublishedPhotos(), getCategories()]);
  return (
    <>
      <PageHeader
        eyebrow="Portfolio"
        title={
          <>
            Le <span className="text-red">regard</span>
          </>
        }
        intro="Automobile, moto, compétition, sorties et événements : une sélection d'images où la machine, le pilote et le moment ne font qu'un."
      />
      <div className="container-x pb-24">
        <PortfolioGallery photos={photos} categories={categories} />
      </div>
    </>
  );
}
