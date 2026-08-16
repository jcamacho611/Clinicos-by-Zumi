import Image from "next/image";
import Link from "next/link";

// These point at the files that actually ship in public/. The previous
// "-transparent" names had no corresponding assets, so the mark and wordmark 404'd
// on every surface that renders the brand — the public site, login, the sales shell
// and every authenticated page.
const MARK_SRC = "/klinikos-orbital-k-generated.webp";
const WORDMARK_SRC = "/klinikos-wordmark-generated.webp";

export function KlinikosMark({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <span className={`relative inline-block ${className}`} aria-hidden="true">
      <Image
        alt=""
        aria-hidden="true"
        className="h-full w-full object-contain"
        height={640}
        priority
        src={MARK_SRC}
        unoptimized
        width={640}
      />
    </span>
  );
}

function KlinikosLettering({ className = "h-[24px] w-auto" }: { className?: string }) {
  return (
    <span className={`relative inline-block ${className}`}>
      <Image
        alt="Klinikos"
        className="h-full w-full object-contain"
        height={400}
        priority
        src={WORDMARK_SRC}
        unoptimized
        width={1200}
      />
    </span>
  );
}

export function KlinikosWordmark({
  className = "",
  markClassName = "h-7 w-7",
  textClassName = "h-[24px] w-[220px]",
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
    <span className={`inline-flex items-center gap-3 ${inverse ? "text-white" : "text-current"} ${className}`}>
      <span
        className={
          framed
            ? "grid size-14 place-items-center rounded-[16px] border border-[#efaaa1]/16 bg-transparent shadow-[0_0_34px_rgba(232,126,121,.08)]"
            : "inline-grid place-items-center"
        }
      >
        <KlinikosMark className={markClassName} />
      </span>
      <KlinikosLettering className={textClassName} />
    </span>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
