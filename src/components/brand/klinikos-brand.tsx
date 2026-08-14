import Link from "next/link";

export function KlinikosMark({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
      <path d="M45 13v70" stroke="currentColor" strokeLinecap="round" strokeWidth="8" />
      <path d="M45 49 72 20" stroke="currentColor" strokeLinecap="round" strokeWidth="8" />
      <path d="M45 49 76 79" stroke="currentColor" strokeLinecap="round" strokeWidth="8" />
      <path d="M18 63c10-22 29-35 58-38" stroke="currentColor" strokeLinecap="round" strokeWidth="5" />
      <circle cx="80" cy="23" fill="currentColor" r="4" />
    </svg>
  );
}

export function KlinikosWordmark({
  className = "",
  markClassName = "h-7 w-7",
  textClassName = "text-sm",
  href,
  inverse = false,
  framed = false,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  href?: string;
  inverse?: boolean;
  framed?: boolean;
}) {
  const content = (
    <span className={`inline-flex items-center gap-4 ${inverse ? "text-white" : "text-current"} ${className}`}>
      <span className={framed ? "grid size-14 place-items-center rounded-2xl border border-white/10 bg-black/40 shadow-[0_0_38px_rgba(232,126,121,.08)]" : "inline-grid place-items-center"}>
        <KlinikosMark className={markClassName} />
      </span>
      <span className={`font-medium uppercase tracking-[0.28em] ${textClassName}`}>Klinikos</span>
    </span>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
