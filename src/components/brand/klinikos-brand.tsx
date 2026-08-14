import Link from "next/link";

export function KlinikosMark({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
      <path d="M45 16C42 31 39 48 38 78" stroke="currentColor" strokeLinecap="round" strokeWidth="4.2" />
      <path d="M38 50C49 39 60 28 73 18" stroke="currentColor" strokeLinecap="round" strokeWidth="4.2" />
      <path d="M39 50C51 58 62 67 74 78" stroke="currentColor" strokeLinecap="round" strokeWidth="4.2" />
      <path d="M17 64C28 43 49 30 78 27" stroke="currentColor" strokeLinecap="round" strokeWidth="2.8" />
      <path d="M20 63C33 66 48 61 58 50" stroke="#efaaa1" strokeLinecap="round" strokeWidth="1.4" opacity=".72" />
      <circle cx="79" cy="26" fill="#efaaa1" r="3.2" />
    </svg>
  );
}

function KlinikosLettering({ className = "h-[24px] w-auto" }: { className?: string }) {
  return (
    <svg
      aria-label="Klinikos"
      className={className}
      height="39"
      width="270"
      preserveAspectRatio="xMinYMid meet"
      role="img"
      viewBox="0 0 238 34"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75">
        <path d="M3 29C4 20 5 11 7 4M5 18C12 13 17 8 21 3M6 18C12 21 18 25 23 30" />
        <path d="M31 4C30 12 29 21 30 29C34 30 39 30 44 29" />
        <path d="M52 5C53 12 53 22 52 30M50 4C54 3 57 3 60 4" />
        <path d="M67 29C69 19 69 11 68 5C75 13 81 21 87 29C88 21 88 13 90 5" />
        <path d="M101 5C100 13 99 22 100 30M99 4C103 3 106 3 109 4" />
        <path d="M117 29C119 20 119 11 121 4M119 18C126 13 131 8 136 3M120 18C127 21 133 25 139 30" />
        <path d="M157 5C146 4 141 11 142 18C143 26 150 30 158 29C166 28 170 21 168 14C167 8 163 5 157 5Z" />
        <path d="M178 29C180 20 180 12 180 5C187 13 193 21 199 29C200 21 200 13 202 5" />
        <path d="M212 6C216 3 224 4 228 7C224 8 217 9 215 13C213 17 219 18 224 19C230 21 233 25 229 29C225 32 216 31 212 27" />
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
      <span className={framed ? "grid size-14 place-items-center rounded-[16px] border border-[#efaaa1]/16 bg-[#090405]/76 shadow-[0_0_34px_rgba(232,126,121,.08)]" : "inline-grid place-items-center"}>
        <KlinikosMark className={markClassName} />
      </span>
      <KlinikosLettering className={textClassName} />
    </span>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
