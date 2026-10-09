import type { ReactNode } from "react";

export function SectionTitle({
  index,
  eyebrow,
  title,
  aside,
  light = false,
}: {
  index?: string;
  eyebrow: string;
  title: ReactNode;
  aside?: ReactNode;
  light?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-6 border-t pt-6 md:flex-row md:items-end md:justify-between ${light ? "border-line-dark" : "border-line"}`}>
      <div>
        <p className={`eyebrow mb-4 flex items-center gap-3 ${light ? "text-ink/60" : "text-paper/60"}`}>
          {index && <span className="text-red">{index}</span>}
          {eyebrow}
        </p>
        <h2 className="display text-5xl sm:text-6xl lg:text-7xl">{title}</h2>
      </div>
      {aside && <div className="max-w-md">{aside}</div>}
    </div>
  );
}
