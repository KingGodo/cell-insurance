import { riskTerm, valueTerm } from "@/lib/format";

export function ScoreBar({ score, fill, track }: { score: number; fill: string; track: string }) {
  return (
    <span className={`mt-2 block h-1.5 overflow-hidden rounded-full ${track}`} aria-hidden="true">
      <span className={`block h-full rounded-full ${fill}`} style={{ width: `${Math.max(8, Math.min(100, score))}%` }} />
    </span>
  );
}

export function RiskChip({ band, score }: { band: string; score: number }) {
  const surface =
    band === "LEAVING"
      ? "bg-foreground text-primary"
      : band === "WATCH"
        ? "bg-primary text-foreground"
        : "bg-accent text-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${surface}`}>
      {riskTerm(band)} {score}
    </span>
  );
}

export function ValueChip({ band, score }: { band: string; score: number }) {
  const surface =
    band === "HIGH"
      ? "bg-primary text-foreground"
      : band === "CORE"
        ? "bg-foreground text-primary"
        : "bg-accent text-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${surface}`}>
      {valueTerm(band)} {score}
    </span>
  );
}
