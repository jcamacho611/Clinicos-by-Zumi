import Link from "next/link";

export function KlinikosMark({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
      <path d="M46 15v66" stroke="currentColor" strokeLinecap="round" strokeWidth="7" />
      <path d="M46 49 72 22" stroke="currentColor" strokeLinecap="round" strokeWidth="7" />
      <path d="M46 49 75 77" stroke="currentColor" strokeLinecap="round" strokeWidth="7" />
      <path d="M18 64c11-23 30-36 57-39" stroke="currentColor" strokeLinecap="round" strokeWidth="4.5" />
      <circle cx="79" cy="23" fill="currentColor" r="3.5" />
    </svg>
  );
}

function KlinikosLettering({ className = "h-[24px] w-auto" }: { className?: string }) {
  return (
    <svg aria-label="Klinikos" className={className} role="img" viewBox="0 0 238 34" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.15">
        <path d="M3 4v26M3 17 16 4M3 17l14 13" />
        <path d="M27 4v26" />
        <path d="M40 30V4l18 26V4" />
        <path d="M70 4v26" />
        <path d="M82 4v26M82 17 95 4M82 17l14 13" />
        <ellipse cx="115" cy="17" rx="10.5" ry="13" />
        <path d="M138 30V4l18 26V4" />
        <path d="M169 4v26" />
        <path d="M182 4v26M182 17l13-13M182 17l14 13" />
        <ellipse cx="214" cy="17" rx="10.5" ry="13" />
        <path d="M234 7c-3-3-6-4-10-3-5 1-7 4-6 7 1 3 4 4 8 5 5 1 8 3 8 7 0 5-4 8-10 8-4 0-8-1-11-4" />
      </g>
    </svg>
  );
}

export function KlinikosWordmark({
  className = "",
  markClassName = "h-7 w-7",
  textClassName = "h-[24px] w-auto",
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
      <span className={framed ? "grid size-14 place-items-center rounded-[16px] border border-white/12 bg-[#090405]/72 shadow-[0_0_34px_rgba(232,126,121,.08)]" : "inline-grid place-items-center"}>
        <KlinikosMark className={markClassName} />
      </span>
      <KlinikosLettering className={textClassName} />
    </span>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
