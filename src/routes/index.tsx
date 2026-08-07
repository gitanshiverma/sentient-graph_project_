import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { useCorpus, type EntityType } from "@/lib/corpus";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen — GraphRAG Compliance Dashboard" },
      {
        name: "description",
        content:
          "Ingest contracts and policies, build a knowledge graph, and query obligations with cited, grounded answers.",
      },
      { property: "og:title", content: "Lumen — GraphRAG Compliance Dashboard" },
      {
        property: "og:description",
        content: "Knowledge-graph powered compliance review for contracts and policies.",
      },
    ],
  }),
  component: Dashboard,
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

function Dashboard() {
  const { docs, chunks, entities, edges } = useCorpus();
  const ingested = docs.filter((d) => d.stage === "done");

  const byType = (Object.keys(typeColor) as EntityType[])
    .map((t) => ({ name: t, value: entities.filter((e) => e.type === t).length }))
    .filter((d) => d.value > 0);

  const perDoc = ingested
    .slice(0, 8)
    .map((d) => ({ name: d.name.replace(/\.[a-z0-9]+$/i, "").slice(0, 14), chunks: d.chunks, risk: d.risk }))
    .reverse();

  const stats = [
    { label: "Documents", value: ingested.length },
    { label: "Chunks embedded", value: chunks.length },
    { label: "Graph entities", value: entities.length },
    { label: "Relationships", value: edges.length },
  ];

  return (
    <AppShell
      title="Dashboard"
      subtitle="Corpus coverage, extraction quality and risk at a glance."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-background p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {ingested.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-background px-6 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No data yet.{" "}
            <Link
              to="/ingestion"
              className="font-medium text-foreground underline underline-offset-4"
            >
              Ingest your first document
            </Link>{" "}
            to populate the charts.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background p-6">
            <h2 className="text-sm font-semibold">Chunks and risk per document</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perDoc}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      background: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="chunks" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="risk" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-6">
            <h2 className="text-sm font-semibold">Entity mix</h2>
            <div className="mt-4 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byType} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                    {byType.map((d) => (
                      <Cell key={d.name} fill={typeColor[d.name as EntityType]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
