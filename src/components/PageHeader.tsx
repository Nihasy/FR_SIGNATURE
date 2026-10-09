import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, intro }: { eyebrow: string; title: ReactNode; intro?: ReactNode }) {
  return (
    <header className="container-x pb-12 pt-32 md:pb-16 md:pt-44">
      <p className="eyebrow mb-6 flex items-center gap-3 text-paper/60">
        <span className="h-px w-10 bg-red" />
        {eyebrow}
      </p>
      <h1 className="display text-6xl sm:text-8xl lg:text-[9rem]">{title}</h1>
      {intro && <div className="mt-8 max-w-2xl text-lg leading-relaxed text-paper/65">{intro}</div>}
    </header>
  );
}
