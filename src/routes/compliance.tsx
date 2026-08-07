import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useCorpus } from "@/lib/corpus";

export const Route = createFileRoute("/compliance")({
  head: () => ({
    meta: [
      { title: "Compliance Findings — Lumen GraphRAG" },
      {
        name: "description",
        content:
          "Obligations, referenced regulations and document risk scores extracted from your ingested corpus.",
      },
      { property: "og:title", content: "Compliance Findings — Lumen GraphRAG" },
      {
        property: "og:description",
        content: "Obligations, regulations and risk scores across your corpus.",
      },
    ],
  }),
  component: Compliance,
});

function Compliance() {
  const { entities, docs, chunks } = useCorpus();
  const obligations = entities.filter((e) => e.type === "obligation");
  const controls = entities.filter((e) => e.type === "control");
  const dates = entities.filter((e) => e.type === "date");
  const amounts = entities.filter((e) => e.type === "amount");
  const ingested = docs.filter((d) => d.stage === "done");
  const docName = (id: string) => docs.find((d) => d.id === id)?.name ?? "Unknown document";

  const severity = (text: string): "high" | "medium" | "low" => {
    const t = text.toLowerCase();
    if (/(penalt|terminat|breach|indemnif|liabilit|sanction|shall not|may not|prohibited)/.test(t))
      return "high";
    if (/(must|shall|required to|no later than|within \d+)/.test(t)) return "medium";
    return "low";
  };
  const sevStyle: Record<string, string> = {
    high: "border-destructive/40 text-destructive",
    medium: "border-border text-foreground",
    low: "border-border text-muted-foreground",
  };
  const rank = { high: 0, medium: 1, low: 2 } as const;
  const ranked = [...obligations].sort(
    (a, b) => rank[severity(a.label)] - rank[severity(b.label)] || b.mentions - a.mentions,
  );
  const counts = {
    high: obligations.filter((o) => severity(o.label) === "high").length,
    medium: obligations.filter((o) => severity(o.label) === "medium").length,
    low: obligations.filter((o) => severity(o.label) === "low").length,
  };

  return (
    <AppShell
      title="Compliance"
      subtitle="Obligations and regulatory references detected across the corpus."
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Obligations", value: obligations.length },
          { label: "High severity", value: counts.high },
          { label: "Regulations", value: controls.length },
          { label: "Key dates", value: dates.length },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-background p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold">Detected obligations</h2>
          {obligations.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {ingested.length === 0
                ? "No documents ingested yet — upload a contract or policy on the Ingestion page."
                : `No obligation language ("shall", "must", "required to"…) was found in the ${ingested.length} ingested document(s).`}
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {ranked.slice(0, 40).map((o) => (
                <li key={o.id} className="rounded-xl border border-border p-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <p>{o.label}</p>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] capitalize ${sevStyle[severity(o.label)]}`}
                    >
                      {severity(o.label)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {o.docIds.map(docName).join(", ")} · {o.mentions} mention(s)
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-background p-6">
            <h2 className="text-sm font-semibold">Regulations referenced</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {controls.length === 0 && (
                <p className="text-sm text-muted-foreground">None detected.</p>
              )}
              {controls.map((c) => (
                <span
                  key={c.id}
                  className="rounded-full border border-border px-3 py-1.5 text-xs"
                >
                  {c.label} · {c.mentions}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-background p-6">
            <h2 className="text-sm font-semibold">Key dates & amounts</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {dates.length + amounts.length === 0 && (
                <p className="text-sm text-muted-foreground">None detected.</p>
              )}
              {[...dates, ...amounts].slice(0, 18).map((e) => (
                <span key={e.id} className="rounded-full border border-border px-3 py-1.5 text-xs">
                  {e.label}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-background p-6">
            <h2 className="text-sm font-semibold">Document risk</h2>
            <ul className="mt-4 space-y-3">
              {ingested.length === 0 && (
                <p className="text-sm text-muted-foreground">No documents scored.</p>
              )}
              {ingested.map((d) => (
                <li key={d.id} className="text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate">{d.name}</span>
                    <span className="text-xs text-muted-foreground">{d.risk}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground"
                      style={{ width: `${d.risk}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {chunks.filter((c) => c.docId === d.id).length} chunks ·{" "}
                    {obligations.filter((o) => o.docIds.includes(d.id)).length} obligations
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}