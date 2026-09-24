"use client";

import { useState } from "react";

const questions = [
  { id: "policies", label: "What policies do I have?" },
  { id: "claim", label: "What is the status of my claim?" },
  { id: "renewal", label: "When does my policy expire?" },
] as const;

export function AskPanel({
  policies,
  claims,
  renewal,
}: {
  policies: string[];
  claims: string[];
  renewal: string;
}) {
  const [active, setActive] = useState<(typeof questions)[number]["id"] | null>(null);
  const answer =
    active === "policies"
      ? policies.join(". ")
      : active === "claim"
        ? claims.join(". ")
        : active === "renewal"
          ? `The next renewal on file is ${renewal}.`
          : "Ask about your cover, a claim, or a renewal. Answers come from your own CustomerIQ record.";

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <h2 className="text-sm font-semibold">Ask CustomerIQ</h2>
      <p className="mt-2 text-sm text-muted-foreground">Questions stay inside your authenticated record.</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {questions.map((question) => {
          const selected = active === question.id;
          return (
          <button
            key={question.id}
            type="button"
            onClick={() => setActive(question.id)}
            className={`h-9 rounded-full px-3 text-sm ${
              selected ? "bg-foreground font-medium text-background" : "border border-border hover:bg-secondary"
            }`}
            aria-pressed={selected}
          >
            {question.label}
          </button>
          );
        })}
      </div>
      <p className="mt-5 text-sm leading-relaxed" aria-live="polite">
        {answer}
      </p>
    </section>
  );
}
