import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid size-10 place-items-center overflow-hidden rounded-[13px] border border-[#efaaa1]/18 bg-[#070304]/88 text-[#fff9f7] shadow-[0_0_34px_rgba(230,129,123,.08)]",
        className,
      )}
      aria-hidden="true"
    >
      <svg className="size-7 overflow-visible" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M45 16C42 31 39 48 38 78" stroke="currentColor" strokeLinecap="round" strokeWidth="4.2" />
        <path d="M38 50C49 39 60 28 73 18" stroke="currentColor" strokeLinecap="round" strokeWidth="4.2" />
        <path d="M39 50C51 58 62 67 74 78" stroke="currentColor" strokeLinecap="round" strokeWidth="4.2" />
        <path d="M17 64C28 43 49 30 78 27" stroke="currentColor" strokeLinecap="round" strokeWidth="2.8" />
        <path d="M20 63C33 66 48 61 58 50" stroke="#efaaa1" strokeLinecap="round" strokeWidth="1.4" opacity=".7" />
        <circle cx="79" cy="26" r="3.2" fill="#efaaa1" />
      </svg>
    </span>
  );
}
