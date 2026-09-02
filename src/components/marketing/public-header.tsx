import Link from "next/link";
import { Menu } from "lucide-react";
import { KlinikosWordmark } from "@/components/brand/klinikos-brand";

const publicNavigation = [
  { label: "How Klinikos helps", href: "/how-it-works" },
  { label: "Explore Grid", href: "/grid" },
  { label: "Find care", href: "/grid/browse?intent=provider" },
  { label: "Learn", href: "/edu" },
  { label: "For clinics", href: "/founding-clinic" },
] as const;

export function PublicHeader({ contextLabel }: { contextLabel?: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--k-line)] bg-[color:var(--k-public-surface)]/95 text-[var(--k-text)] backdrop-blur-xl" data-public-header="true">
      <div className="mx-auto flex min-h-[72px] max-w-[1500px] items-center gap-4 px-4 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="rounded-[12px] bg-[#070304] p-1.5">
            <KlinikosWordmark
              className="gap-2.5"
              frameClassName="size-8"
              framed
              href="/"
              inverse
              markClassName="h-full w-full"
              textClassName="h-[17px] w-[150px]"
            />
          </span>
          {contextLabel ? <span className="hidden border-l border-[var(--k-line)] pl-3 text-[10px] font-extrabold uppercase tracking-[.16em] text-[var(--k-accent)] xl:block">{contextLabel}</span> : null}
        </div>

        <nav aria-label="Primary Klinikos navigation" className="ml-auto hidden items-center gap-5 text-[11px] font-bold text-[var(--k-muted)] lg:flex">
          {publicNavigation.map((item) => <Link className="inline-flex min-h-11 items-center hover:text-[var(--k-text)]" href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <Link className="inline-flex min-h-11 items-center rounded-full border border-[var(--k-line)] px-4 text-[11px] font-bold text-[var(--k-text)] hover:border-[var(--k-accent)]" href="/signup">Membership status</Link>
          <Link className="inline-flex min-h-11 items-center px-2 text-[11px] font-bold text-[var(--k-muted)] hover:text-[var(--k-text)]" href="/login">Sign in</Link>
        </div>

        <details className="group relative ml-auto lg:hidden">
          <summary aria-label="Open Klinikos navigation" className="grid min-h-11 min-w-11 cursor-pointer list-none place-items-center rounded-full border border-[var(--k-line)] text-[var(--k-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-accent)] [&::-webkit-details-marker]:hidden">
            <Menu aria-hidden="true" className="size-5" />
          </summary>
          <nav aria-label="Mobile Klinikos navigation" className="absolute right-0 top-[calc(100%+.75rem)] grid w-[min(19rem,calc(100vw-2rem))] gap-1 rounded-[20px] border border-[var(--k-line)] bg-[var(--k-public-surface)] p-3 shadow-[var(--k-shadow)]">
            {publicNavigation.map((item) => <Link className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[var(--k-text)] hover:bg-[var(--k-public-raised)]" href={item.href} key={item.href}>{item.label}</Link>)}
            <div className="my-1 border-t border-[var(--k-line)]" />
            <Link className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[var(--k-text)] hover:bg-[var(--k-public-raised)]" href="/portal/login">Patient access</Link>
            <Link className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[var(--k-text)] hover:bg-[var(--k-public-raised)]" href="/signup">Membership status</Link>
            <Link className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-[var(--k-text)] hover:bg-[var(--k-public-raised)]" href="/login">Sign in</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
