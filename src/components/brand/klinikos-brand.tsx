import Image from "next/image";
import Link from "next/link";

const MARK_SRC = "/klinikos-orbital-k-generated.webp";
const WORDMARK_SRC = "/klinikos-wordmark-generated.webp";

export function KlinikosMark({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <Image
      alt=""
      aria-hidden="true"
      className={`object-contain ${className}`}
      height={640}
      priority
      src={MARK_SRC}
      unoptimized
      width={640}
    />
  );
}

function KlinikosLettering({ className = "h-[24px] w-auto" }: { className?: string }) {
  return (
    <Image
      alt="Klinikos"
      className={`object-contain object-left ${className}`}
      height={400}
      priority
      src={WORDMARK_SRC}
      unoptimized
      width={1200}
    />
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
      <span
        className={
          framed
            ? "grid size-14 place-items-center overflow-hidden rounded-[16px] border border-[#efaaa1]/16 bg-[#050303] shadow-[0_0_34px_rgba(232,126,121,.08)]"
            : "inline-grid place-items-center overflow-hidden"
        }
      >
        <KlinikosMark className={markClassName} />
      </span>
      <span className="inline-flex overflow-hidden bg-[#050303]">
        <KlinikosLettering className={textClassName} />
      </span>
    </span>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
