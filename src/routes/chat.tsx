import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { SendHorizonal } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useCorpus } from "@/lib/corpus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "GraphRAG Chat — Lumen" },
      {
        name: "description",
        content:
          "Ask questions about your compliance corpus and get answers grounded in retrieved document evidence.",
      },
      { property: "og:title", content: "GraphRAG Chat — Lumen" },
      {
        property: "og:description",
        content: "Answers grounded in retrieved evidence from your own documents.",
      },
    ],
  }),
  component: Chat,
});

type Message = {
  role: "user" | "assistant";
  text: string;
  citations?: { doc: string; page: number; snippet: string }[];
};

function Chat() {
  const { search, docs, entities } = useCorpus();
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [value, setValue] = React.useState("");

  const ask = (question: string) => {
    const q = question.trim();
    if (!q) return;
    const hits = search(q, 4);
    const entityHits = entities
      .filter((e) => q.toLowerCase().includes(e.label.toLowerCase().slice(0, 18)))
      .slice(0, 3);

    const answer: Message = hits.length
      ? {
          role: "assistant",
          text:
            `Based on ${hits.length} retrieved passage${hits.length > 1 ? "s" : ""}` +
            (entityHits.length ? ` and ${entityHits.length} graph entit${entityHits.length > 1 ? "ies" : "y"}` : "") +
            `:\n\n` +
            hits
              .map((h) => `• ${h.chunk.text.replace(/\s+/g, " ").trim().slice(0, 260)}…`)
              .join("\n\n"),
          citations: hits.map((h) => ({
            doc: h.chunk.docName,
            page: h.chunk.page,
            snippet: h.chunk.text.slice(0, 140),
          })),
        }
      : {
          role: "assistant",
          text: docs.length
            ? "No passage in the ingested corpus supports an answer to that. The hallucination guard refuses to answer without retrieved evidence."
            : "Nothing has been ingested yet — upload documents on the Ingestion page first.",
        };

    setMessages((m) => [...m, { role: "user", text: q }, answer]);
    setValue("");
  };

  return (
    <AppShell
      title="GraphRAG Chat"
      subtitle="Every answer is retrieved from your corpus and cited back to the source page."
    >
      <div className="flex h-[calc(100vh-15rem)] flex-col rounded-2xl border border-border bg-background">
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {messages.length === 0 && (
            <div className="text-sm text-muted-foreground">
              <p>Try asking:</p>
              <ul className="mt-3 space-y-2">
                {[
                  "What are the termination obligations?",
                  "Which regulations are referenced?",
                  "What penalties apply for non-compliance?",
                ].map((s) => (
                  <li key={s}>
                    <button
                      onClick={() => ask(s)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-foreground text-background"
                    : "border border-border bg-muted/40"
                }`}
              >
                {m.text}
                {m.citations && (
                  <ul className="mt-3 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                    {m.citations.map((c, j) => (
                      <li key={j}>
                        [{j + 1}] {c.doc} · p.{c.page}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(value);
          }}
          className="flex items-center gap-3 border-t border-border p-4"
        >
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask about obligations, deadlines, penalties…"
          />
          <Button type="submit" size="icon" aria-label="Send">
            <SendHorizonal className="size-4" />
          </Button>
        </form>
      </div>
    </AppShell>
  );
}