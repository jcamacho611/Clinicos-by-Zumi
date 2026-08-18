import { Badge } from "@/components/ui/badge";
import { SectionCard, StatCard } from "@/components/clinic/workspace-kit";
import { LuxeReactivationReviewForm } from "@/components/clinic/luxe-reactivation-review-form";
import { RotateCcw, ShieldAlert, WalletCards } from "lucide-react";

type RecoveryQueueItem = {
  id: string;
  name: string;
  source: string;
  serviceInterest: string | null;
  estimatedOpportunity: string;
  status: string;
  bookingStatus: string;
  reason: "lost_review" | "stale_unbooked";
  lostReason: string | null;
  daysSinceActivity: number;
  communicationEligibility: "review_required";
};

type RecoveryReview = {
  staleAfterDays: number;
  metrics: {
    reviewCandidates: number;
    reviewEstimatedOpportunity: string;
    suppressedCandidates: number;
    suppressedEstimatedOpportunity: string;
  };
  queue: RecoveryQueueItem[];
};

export function LuxeRecoverySection({ canReactivate, recovery }: { canReactivate: boolean; recovery: RecoveryReview }) {
  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard accent="amber" detail={`Lost or non-booked and stale for ${recovery.staleAfterDays}+ days`} icon={<RotateCcw className="size-4" />} label="Recovery review" value={String(recovery.metrics.reviewCandidates)} />
        <StatCard accent="violet" detail="Estimated opportunity only, not guaranteed revenue" icon={<WalletCards className="size-4" />} label="Review opportunity" value={recovery.metrics.reviewEstimatedOpportunity} />
        <StatCard accent="rose" detail="Opt-outs/suppressed or clearly invalid records kept out of action" icon={<ShieldAlert className="size-4" />} label="Suppressed" value={String(recovery.metrics.suppressedCandidates)} />
      </div>

      <SectionCard title="Recovery review" description="Lost or stale opportunities that may deserve human review. Communication permission is never inferred, and no outreach is sent automatically.">
        <div className="divide-y divide-slate-100">
          {recovery.queue.map((lead) => (
            <article className="p-4" key={lead.id}>
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xs font-extrabold text-slate-900">{lead.name}</h3>
                    <Badge tone="amber">{lead.reason === "lost_review" ? "Lost review" : "Stale unbooked"}</Badge>
                    <Badge tone="rose">Consent review required</Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{lead.serviceInterest ?? "Service interest pending"} · {lead.estimatedOpportunity} estimated · source {lead.source}</p>
                  <p className="mt-2 text-[12px] text-slate-400">{lead.daysSinceActivity} days since CRM activity{lead.lostReason ? ` · prior lost reason: ${lead.lostReason}` : ""}</p>
                  {canReactivate && <LuxeReactivationReviewForm leadId={lead.id} />}
                </div>
              </div>
            </article>
          ))}
          {!recovery.queue.length && <p className="p-5 text-xs text-slate-500">No current Luxe leads meet the recovery-review criteria.</p>}
        </div>
      </SectionCard>

      {recovery.metrics.suppressedCandidates > 0 && (
        <p className="text-[12px] leading-4 text-slate-500">{recovery.metrics.suppressedCandidates} record(s), representing {recovery.metrics.suppressedEstimatedOpportunity} in estimated opportunity, are intentionally excluded from action because of explicit suppression/opt-out state or clearly non-recoverable lost reasons.</p>
      )}
    </section>
  );
}
