import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { AppShell } from "@/components/AppShell";
import { useCorpus, type EntityType } from "@/lib/corpus";

export const Route = createFileRoute("/graph")({
  head: () => ({
    meta: [
      { title: "Knowledge Graph — Lumen GraphRAG" },
      {
        name: "description",
        content:
          "Explore entities and relationships extracted from your compliance corpus as an interactive knowledge graph.",
      },
      { property: "og:title", content: "Knowledge Graph — Lumen GraphRAG" },
      {
        property: "og:description",
        content: "Entities and relationships extracted from your compliance corpus.",
      },
    ],
  }),
  component: GraphPage,
});

const typeColor: Record<EntityType, string> = {
  org: "var(--chart-1)",
  control: "var(--chart-2)",
  obligation: "var(--chart-3)",
  date: "var(--chart-4)",
  amount: "var(--chart-5)",
  person: "var(--muted-foreground)",
  topic: "var(--primary)",
};

function GraphPage() {
  const { entities, edges } = useCorpus();
  const [selected, setSelected] = React.useState<string | null>(null);

  const nodes = React.useMemo(() => {
    const top = [...entities].sort((a, b) => b.mentions - a.mentions).slice(0, 48);
    const cx = 500;
    const cy = 320;
    // Distribute nodes over as many rings as needed, keeping each ring sparse.
    const rings: number[][] = [];
    let cursor = 0;
    let capacity = 6;
    while (cursor < top.length) {
      rings.push(
        Array.from({ length: Math.min(capacity, top.length - cursor) }, (_, k) => cursor + k),
      );
      cursor += capacity;
      capacity += 6;
    }
    const ringOf = new Map<number, { ring: number; idx: number; size: number }>();
    rings.forEach((members, ring) =>
      members.forEach((globalIdx, idx) =>
        ringOf.set(globalIdx, { ring, idx, size: members.length }),
      ),
    );
    const maxRing = Math.max(1, rings.length);
    return top.map((e, i) => {
      const { ring, idx, size } = ringOf.get(i)!;
      const r = 120 + (ring / maxRing) * 230;
      const angle = (idx / size) * Math.PI * 2 + ring * 0.55;
      return {
        ...e,
        x: cx + Math.cos(angle) * r * 1.35,
        y: cy + Math.sin(angle) * r * 0.82,
        radius: 5 + Math.min(9, e.mentions),
      };
    });
  }, [entities]);

  const positions = React.useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes],
  );
  const visibleEdges = edges.filter((e) => positions.has(e.source) && positions.has(e.target));
  const focus = selected ? entities.find((e) => e.id === selected) : null;
  const focusEdges = focus ? visibleEdges.filter((e) => e.source === focus.id || e.target === focus.id) : [];

  return (
    <AppShell
      title="Knowledge Graph"
      subtitle="Entities and relationships extracted from every ingested document."
    >
      {entities.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="overflow-hidden rounded-2xl border border-border bg-background">
            <svg viewBox="0 0 1000 640" className="aspect-[1000/640] w-full">
              {visibleEdges.map((e, i) => {
                const a = positions.get(e.source)!;
                const b = positions.get(e.target)!;
                const active = selected && (e.source === selected || e.target === selected);
                return (
                  <line
                    key={i}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="currentColor"
                    className={active ? "text-foreground" : "text-border"}
                    strokeWidth={active ? 1.6 : 0.8}
                  />
                );
              })}
              {nodes.map((n) => (
                <g
                  key={n.id}
                  onClick={() => setSelected(n.id === selected ? null : n.id)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={n.radius}
                    fill={typeColor[n.type]}
                    opacity={!selected || selected === n.id ? 1 : 0.35}
                  />
                  <text
                    x={n.x}
                    y={n.y - n.radius - 6}
                    textAnchor="middle"
                    className="fill-foreground text-[10px]"
                    opacity={!selected || selected === n.id ? 0.9 : 0.3}
                  >
                    {n.label.length > 26 ? `${n.label.slice(0, 26)}…` : n.label}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-background p-5">
              <h2 className="text-sm font-semibold">Legend</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {(Object.keys(typeColor) as EntityType[]).map((t) => (
                  <li key={t} className="flex items-center gap-2 capitalize">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: typeColor[t] }}
                    />
                    {t} · {entities.filter((e) => e.type === t).length}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-background p-5">
              <h2 className="text-sm font-semibold">
                {focus ? "Selected entity" : "Graph summary"}
              </h2>
              {focus ? (
                <div className="mt-3 space-y-2 text-sm">
                  <p className="font-medium">{focus.label}</p>
                  <p className="text-muted-foreground capitalize">
                    {focus.type} · {focus.mentions} mentions · {focus.docIds.length} document(s)
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {focusEdges.slice(0, 8).map((e, i) => (
                      <li key={i}>
                        {e.relation} → {positions.get(e.source === focus.id ? e.target : e.source)?.label.slice(0, 40)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                  {entities.length} entities and {edges.length} relationships. Click a node to
                  inspect its connections.
                </p>
              )}
            </div>
          </aside>
        </div>
      )}
    </AppShell>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-border bg-background px-6 py-16 text-center">
      <p className="text-sm text-muted-foreground">
        The graph is built from ingested documents.{" "}
        <Link to="/ingestion" className="font-medium text-foreground underline underline-offset-4">
          Upload a document
        </Link>{" "}
        to populate it.
      </p>
    </div>
  );
}