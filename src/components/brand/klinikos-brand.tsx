import Image from "next/image";
import Link from "next/link";

const MARK_SRC = "/klinikos-orbital-k-generated.webp";
const WORDMARK_SRC = "/klinikos-wordmark-generated.webp";

export function KlinikosMark({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <span className={`relative inline-block overflow-hidden ${className}`} aria-hidden="true">
      <Image
        alt=""
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 h-[108%] w-[108%] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover mix-blend-screen"
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
        className="absolute left-1/2 top-1/2 h-[320%] w-[104%] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover object-center mix-blend-screen"
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
      <span
        className={
          framed
            ? "grid size-14 place-items-center overflow-hidden rounded-[16px] border border-[#efaaa1]/16 bg-transparent shadow-[0_0_34px_rgba(232,126,121,.08)]"
            : "inline-grid place-items-center overflow-hidden"
        }
      >
        <KlinikosMark className={markClassName} />
      </span>
      <KlinikosLettering className={textClassName} />
    </span>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
