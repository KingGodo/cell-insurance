"use client";

import { useState } from "react";

type FeedKey = {
  name: string;
  required: boolean;
  note: string;
};

type Feed = {
  code: string;
  name: string;
  kind: "GATEWAY" | "API";
  origin: string;
  method: "POST";
  path: string;
  headers: string[];
  keys: FeedKey[];
  example: Record<string, unknown>;
  storedIn: string[];
  usedFor: string[];
};

export function ApiSources({ feeds }: { feeds: Feed[] }) {
  const [code, setCode] = useState(feeds[0]?.code ?? "");
  const feed = feeds.find((item) => item.code === code) ?? feeds[0];
  if (!feed) return null;

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[14rem_minmax(0,40rem)]">
      <ul className="flex flex-col gap-1" aria-label="Feeds">
        {feeds.map((item) => {
          const selected = item.code === feed.code;
          return (
            <li key={item.code}>
              <button
                type="button"
                aria-current={selected ? "true" : undefined}
                onClick={() => setCode(item.code)}
                className={`flex h-9 w-full items-center rounded-lg px-2.5 text-left text-sm ${
                  selected ? "bg-foreground font-medium text-background" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {item.name}
              </button>
            </li>
          );
        })}
      </ul>
      <article className="space-y-8">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{feed.kind === "GATEWAY" ? "Gateway" : "API"}</p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">{feed.name}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{feed.origin}</p>
        </div>
        <div>
          <h2 className="text-xs text-muted-foreground">Endpoint</h2>
          <p className="mt-2 font-mono text-sm">{feed.method} {feed.path}</p>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {feed.headers.map((header) => (
              <li key={header} className="font-mono">{header}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xs text-muted-foreground">Keys</h2>
          <ul className="mt-3 divide-y divide-border">
            {feed.keys.map((key) => (
              <li key={key.name} className="grid gap-1 py-2.5 sm:grid-cols-[11rem_1fr] sm:items-baseline">
                <p className="font-mono text-sm">{key.name}</p>
                <p className="text-sm text-muted-foreground">
                  {key.required ? "Required" : "Optional"}. {key.note}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xs text-muted-foreground">Expected body</h2>
          <pre className="mt-3 overflow-x-auto text-xs leading-relaxed">{JSON.stringify(feed.example, null, 2)}</pre>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Stored in {feed.storedIn.join(", ")}. {feed.usedFor.join(". ")}.
        </p>
      </article>
    </div>
  );
}
