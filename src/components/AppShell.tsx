import { Link } from "@tanstack/react-router";
import { Activity, LayoutGrid, Upload, Share2, MessagesSquare, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/ingestion", label: "Ingestion", icon: Upload },
  { to: "/graph", label: "Knowledge Graph", icon: Share2 },
  { to: "/chat", label: "GraphRAG Chat", icon: MessagesSquare },
  { to: "/compliance", label: "Compliance", icon: ShieldCheck },
] as const;

export function AppShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden w-[248px] shrink-0 flex-col border-r border-border bg-background px-4 py-6 md:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <span className="flex size-10 items-center justify-center rounded-full bg-foreground text-background">
            <Activity className="size-5" />
          </span>
          <span>
            <span className="block text-base font-semibold leading-tight">Lumen</span>
            <span className="block text-xs text-muted-foreground">GraphRAG Compliance</span>
          </span>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[status=active]:bg-muted data-[status=active]:font-medium data-[status=active]:text-foreground"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <p className="mt-auto rounded-xl border border-border p-4 text-xs leading-relaxed text-muted-foreground">
          Answers are grounded in your uploaded documents. Anything unsupported by retrieved
          evidence is refused by the hallucination guard.
        </p>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-6 py-6 md:px-10">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {action}
        </header>
        <div className="px-6 py-8 md:px-10">{children}</div>
      </main>
    </div>
  );
}