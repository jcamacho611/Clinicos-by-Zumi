import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative grid size-10 place-items-center overflow-hidden rounded-[14px] bg-[#0b1e3a] shadow-[0_12px_30px_rgba(7,29,45,.25)] ring-1 ring-[#d4af37]/35",
        className,
      )}
      aria-hidden="true"
    >
      <svg className="size-7" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 5.5h3v21H8v-21Z" fill="#F7F8FA" />
        <path d="M11 16 21.5 5.5h4L15 16l10.5 10.5h-4L11 16Z" fill="#D4AF37" />
        <path d="M5.5 4h20.5v2H5.5V4Zm0 22h20.5v2H5.5v-2Z" fill="#D4AF37" opacity=".9" />
      </svg>
    </span>
  );
}
