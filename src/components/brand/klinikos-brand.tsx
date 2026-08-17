import Image from "next/image";
import Link from "next/link";

// Exact production artwork supplied in the approved 2026-08-16 design package.
// The source images intentionally include a black field. The orbital mark retains
// that field; the horizontal wordmark is center-cropped and screened into the
// surrounding surface so its lettering remains faithful without a visible box.
const MARK_SRC = "/klinikos-orbital-k-production.png";
const WORDMARK_SRC = "/klinikos-wordmark-production.png";

export function KlinikosMark({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <span className={`relative inline-block overflow-hidden ${className}`} aria-hidden="true">
      <Image
        alt=""
        aria-hidden="true"
        className="h-full w-full object-cover"
        height={1254}
        priority
        src={MARK_SRC}
        unoptimized
        width={1254}
      />
    </span>
  );
}

function KlinikosLettering({ className = "h-[24px] w-auto" }: { className?: string }) {
  return (
    <span className={`relative inline-block overflow-hidden ${className}`}>
      <Image
        alt="Klinikos"
        className="h-full w-full object-cover object-center mix-blend-screen"
        height={724}
        priority
        src={WORDMARK_SRC}
        unoptimized
        width={2172}
      />
    </span>
  );
}

export function KlinikosWordmark({
  className = "",
  markClassName = "h-7 w-7",
  textClassName = "h-[24px] w-[220px]",
  frameClassName = "size-14",
  href,
  inverse = false,
  framed = false,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  frameClassName?: string;
  href?: string;
  inverse?: boolean;
  framed?: boolean;
}) {
  const content = (
    <span className={`inline-flex items-center gap-3 ${inverse ? "text-white" : "text-current"} ${className}`}>
      <span
        className={
          framed
            ? `grid place-items-center ${frameClassName}`
            : "inline-grid place-items-center"
        }
      >
        <KlinikosMark className={markClassName} />
      </span>
      <KlinikosLettering className={textClassName} />
    </span>
  );

  return href ? <Link className="inline-flex" href={href}>{content}</Link> : content;
}
