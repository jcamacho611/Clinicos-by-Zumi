import type { CurrentVisitClinicalEvidence } from "@/lib/clinical/current-visit-evidence";

function dateLabel(value: string) {
  return value.slice(0, 10);
}

function AttentionBadge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "warning" | "danger" }) {
  const classes = tone === "danger"
    ? "border-rose-200 bg-rose-50 text-rose-700"
    : tone === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-slate-200 bg-slate-50 text-slate-600";

  return <span className={`rounded-full border px-2 py-1 text-[10px] font-extrabold ${classes}`}>{label}</span>;
}

export function CurrentVisitClinicalEvidenceCard({ evidence }: { evidence: CurrentVisitClinicalEvidence }) {
  return <section className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-sm font-extrabold text-slate-950">Orders &amp; results</p>
        <p className="mt-1 text-[12px] leading-5 text-slate-500">Read-only evidence from governed lab and imaging services. Source state is shown without clinical interpretation.</p>
      </div>
      {evidence.status === "available" && <div className="flex flex-wrap gap-1.5">
        {evidence.attention.labNeedsReview > 0 && <AttentionBadge label={`${evidence.attention.labNeedsReview} lab needs review`} tone="warning" />}
        {evidence.attention.criticalLabs > 0 && <AttentionBadge label={`${evidence.attention.criticalLabs} critical lab`} tone="danger" />}
        {evidence.attention.correctedLabs > 0 && <AttentionBadge label={`${evidence.attention.correctedLabs} corrected lab`} />}
        {evidence.attention.urgentImaging > 0 && <AttentionBadge label={`${evidence.attention.urgentImaging} urgent imaging flag`} tone="danger" />}
      </div>}
    </div>

    {evidence.status === "none_available" ? <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[12px] font-extrabold text-slate-800">No lab or imaging evidence is available for this patient in the current organization.</p>
      <p className="mt-1 text-[11px] leading-5 text-slate-500">This is not a normal-result assertion.</p>
    </div> : <div className="mt-5 grid gap-5 xl:grid-cols-2">
      <div>
        <div className="flex items-center justify-between gap-3"><p className="text-[11px] font-extrabold uppercase tracking-[.13em] text-slate-500">Recent labs</p><span className="text-[10px] font-bold text-slate-400">Up to 6</span></div>
        <div className="mt-3 space-y-3">
          {evidence.labs.length === 0 ? <p className="text-[12px] text-slate-400">No lab evidence available.</p> : evidence.labs.map((result) => <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3" key={result.id}>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[12px] font-extrabold text-slate-900">{result.panel}</p>
              <AttentionBadge label={result.reviewStatus} tone={result.reviewStatus === "Needs Review" ? "warning" : "neutral"} />
              {result.critical && <AttentionBadge label="Critical source flag" tone="danger" />}
              {result.reviewStatus === "Corrected" && <AttentionBadge label="Corrected" />}
            </div>
            <p className="mt-2 text-[10px] font-bold text-slate-400">{dateLabel(result.resultedAt)} · v{result.version} · {result.source}{result.sourceReference ? ` · ${result.sourceReference}` : ""}</p>
            {result.correctionOfId && <p className="mt-1 text-[10px] font-bold text-slate-500">Correction of prior result {result.correctionOfId}</p>}
            {result.items.length > 0 && <div className="mt-3 space-y-1.5">{result.items.map((item) => <div className="flex flex-wrap items-baseline justify-between gap-2 text-[11px]" key={item.id}><span className="font-bold text-slate-700">{item.name}</span><span className="text-slate-600">{item.value}{item.unit ? ` ${item.unit}` : ""}{item.flag ? ` · ${item.flag}` : ""}</span></div>)}</div>}
            {result.itemsTruncated && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-bold leading-5 text-amber-800">Current Visit is showing a partial panel. The source contains {result.totalItemCount} total source items; review the authoritative lab workspace for the complete result.</p>}
          </div>)}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3"><p className="text-[11px] font-extrabold uppercase tracking-[.13em] text-slate-500">Recent imaging</p><span className="text-[10px] font-bold text-slate-400">Up to 6</span></div>
        <div className="mt-3 space-y-3">
          {evidence.imaging.length === 0 ? <p className="text-[12px] text-slate-400">No imaging evidence available.</p> : evidence.imaging.map((result) => <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3" key={result.id}>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[12px] font-extrabold text-slate-900">{result.title}</p>
              {result.urgentSourceFlag && <AttentionBadge label="Urgent source flag" tone="danger" />}
              <AttentionBadge label={result.status} />
            </div>
            <p className="mt-2 text-[10px] font-bold text-slate-400">{dateLabel(result.studyPerformedAt)} · v{result.version} · {result.modality} · {result.bodyPart} · {result.facility}</p>
            <p className="mt-1 text-[10px] font-bold text-slate-400">{result.source}{result.sourceReference ? ` · ${result.sourceReference}` : ""}</p>
            {result.correctionOfId && <p className="mt-1 text-[10px] font-bold text-slate-500">Correction of prior report {result.correctionOfId}</p>}
            {result.impression && <div className="mt-3"><p className="text-[9px] font-extrabold uppercase tracking-[.12em] text-slate-400">Source impression</p><p className="mt-1 text-[11px] leading-5 text-slate-700">{result.impression}</p></div>}
            {result.findings && <details className="mt-3"><summary className="cursor-pointer text-[10px] font-extrabold text-teal-700">Source findings</summary><p className="mt-2 text-[11px] leading-5 text-slate-600">{result.findings}</p></details>}
          </div>)}
        </div>
      </div>
    </div>}

    <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] font-bold leading-5 text-slate-500">Evidence visibility does not mean the originating order is complete.</p>
  </section>;
}
