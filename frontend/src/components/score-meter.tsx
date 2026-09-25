import { riskTerm, valueTerm } from "@/lib/format";
import { riskColor, valueColor } from "@/lib/matrix";

export function ScoreBar({ score, fill, track }: { score: number; fill: string; track: string }) {
  return (
    <span className={`mt-2 block h-1.5 overflow-hidden rounded-full ${track}`} aria-hidden="true">
      <span className={`block h-full rounded-full ${fill}`} style={{ width: `${Math.max(8, Math.min(100, score))}%` }} />
    </span>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium">
      <span className="size-2 rounded-full" style={{ background: color }} aria-hidden="true" />
      {label}
    </span>
  );
}

export function RiskChip({ band, score }: { band: string; score: number }) {
  const color = band === "LEAVING" ? riskColor.high : band === "WATCH" ? riskColor.medium : riskColor.low;
  return <Chip label={`${riskTerm(band)} ${score}`} color={color} />;
}

export function ValueChip({ band, score }: { band: string; score: number }) {
  const color = band === "HIGH" ? valueColor.high : band === "CORE" ? valueColor.medium : valueColor.low;
  return <Chip label={`${valueTerm(band)} ${score}`} color={color} />;
}
