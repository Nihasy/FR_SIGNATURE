export function Logo({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 select-none ${className}`} aria-label="FR Signature Auto">
      <span className="display-italic text-[1.35em] leading-none tracking-tight [word-spacing:0.18em]">
        {compact ? "FR" : "FR Signature"}
      </span>
      <span className="inline-block -skew-x-12 bg-red px-[0.45em] py-[0.12em]">
        <span className="display-italic inline-block skew-x-12 text-[1.35em] leading-none text-white">Auto</span>
      </span>
    </span>
  );
}
