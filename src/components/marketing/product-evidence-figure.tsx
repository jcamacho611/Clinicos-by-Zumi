import { ActionCenterWorkspace } from "@/components/clinic/workspaces/action-center";
import { PUBLIC_ACTION_CENTER_EXAMPLE } from "@/lib/marketing/product-evidence";

/**
 * The product, shown rather than described, for public pages.
 *
 * An outside reviewer could not tell what Klinikos does from the website and asked for a
 * pitch deck. Every public page answered in categories. This is the answer in one screen,
 * and it lives in one component so the homepage and /how-it-works cannot drift apart or
 * disagree about how honestly the example is labelled.
 *
 * The parts that must not vary are here: the real component, the inert container, and the
 * caption that says the content is illustrative. Pages supply their own surrounding
 * heading, because the framing that suits a homepage is not the one that suits an
 * explainer.
 */
export function ProductEvidenceFigure({ className = "" }: { className?: string }) {
  return (
    <figure className={className}>
      <div
        className="rounded-[22px] border border-[rgba(226,139,133,.18)] bg-[#0d0708] p-5 sm:p-8"
        /* Inert, not merely unclickable: the rows link into the authenticated app and the
           claim/complete controls call APIs a signed-out visitor cannot use. The caption
           below carries the same information in text, so nothing is lost by keeping this
           out of the tab order. */
        inert
      >
        <ActionCenterWorkspace center={PUBLIC_ACTION_CENTER_EXAMPLE} userId="example" />
      </div>
      <figcaption className="mt-4 flex flex-wrap items-baseline gap-x-2 text-[12px] leading-6 text-[#a8918c]">
        <span className="rounded-full border border-[rgba(226,139,133,.35)] px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[.14em] text-[#e6817b]">Example</span>
        <span className="max-w-3xl">
          The Klinikos action centre, rendered by the same component a signed-in clinic uses, with illustrative
          content in place of a real clinic&rsquo;s work. Three things need a person now — an authorization expiring in two
          days, an abnormal result past its acknowledgement window, and an unsigned visit note. Two are with
          someone else, and two closed recently. Signed in, each row can be claimed or completed in place.
        </span>
      </figcaption>
    </figure>
  );
}
