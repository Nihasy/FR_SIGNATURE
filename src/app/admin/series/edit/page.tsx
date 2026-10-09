import { Suspense } from "react";
import { AlbumEditor } from "@/components/admin/AlbumEditor";

export default function EditSeriesPage() {
  return (
    <Suspense fallback={<p className="eyebrow p-8 text-paper/50">Chargement…</p>}>
      <AlbumEditor />
    </Suspense>
  );
}
