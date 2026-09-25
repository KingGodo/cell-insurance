"use client";

import { useState } from "react";
import { RISK_LINE, VALUE_LINE, matrixSegments, segmentColor, type MatrixSlug } from "@/lib/matrix";

export type PlotPoint = {
  id: string;
  name: string;
  value: number;
  risk: number;
  slug: MatrixSlug;
};

const width = 840;
const height = 520;
const left = 58;
const right = 28;
const top = 28;
const bottom = 46;
const plotW = width - left - right;
const plotH = height - top - bottom;

const mark: Record<MatrixSlug, { core: string; halo: string; wash: string }> = {
  vvip: { core: segmentColor.vvip, halo: "#99f6e4", wash: "#f0fdfa" },
  growable: { core: segmentColor.growable, halo: "#c7d2fe", wash: "#eef2ff" },
  ghost: { core: segmentColor.ghost, halo: "#fde68a", wash: "#fffbeb" },
  "save-me-now": { core: segmentColor["save-me-now"], halo: "#fecdd3", wash: "#fff1f2" },
};

function xOf(value: number) {
  return left + (Math.min(100, Math.max(0, value)) / 100) * plotW;
}

function yOf(risk: number) {
  return top + ((100 - Math.min(100, Math.max(0, risk))) / 100) * plotH;
}

function jitter(id: string) {
  let n = 0;
  for (const char of id) n += char.charCodeAt(0);
  return { dx: (n % 9) - 4, dy: ((n >> 2) % 9) - 4 };
}

export function SegmentPlot({ points }: { points: PlotPoint[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = points.find((point) => point.id === activeId) ?? null;
  const cutX = xOf(VALUE_LINE);
  const cutY = yOf(RISK_LINE);
  const plotRight = left + plotW;
  const plotBottom = top + plotH;
  const ordered = active ? [...points.filter((point) => point.id !== active.id), active] : points;

  const zones: Array<{ slug: MatrixSlug; x: number; y: number; w: number; h: number }> = [
    { slug: "ghost", x: left, y: top, w: cutX - left, h: cutY - top },
    { slug: "save-me-now", x: cutX, y: top, w: plotRight - cutX, h: cutY - top },
    { slug: "growable", x: left, y: cutY, w: cutX - left, h: plotBottom - cutY },
    { slug: "vvip", x: cutX, y: cutY, w: plotRight - cutX, h: plotBottom - cutY },
  ];

  const pills: Array<{ slug: MatrixSlug; x: number; y: number; anchor: "start" | "end" }> = [
    { slug: "ghost", x: left + 14, y: top + 14, anchor: "start" },
    { slug: "save-me-now", x: plotRight - 14, y: top + 14, anchor: "end" },
    { slug: "growable", x: left + 14, y: plotBottom - 14, anchor: "start" },
    { slug: "vvip", x: plotRight - 14, y: plotBottom - 14, anchor: "end" },
  ];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">Value against risk</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {matrixSegments.map((segment) => (
            <li key={segment.slug} className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <span className="size-2.5 rounded-full" style={{ background: mark[segment.slug].core, boxShadow: `0 0 0 3px ${mark[segment.slug].halo}` }} />
              {segment.name}
            </li>
          ))}
        </ul>
      </div>
      <div className="relative w-full max-w-2xl">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Scatter of customers by value and risk.">
          <defs>
            <filter id="point-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.6" floodColor="oklch(0.18 0 0)" floodOpacity="0.28" />
            </filter>
          </defs>
          <clipPath id="plot-clip">
            <rect x={left} y={top} width={plotW} height={plotH} rx="22" />
          </clipPath>
          <rect x={left} y={top} width={plotW} height={plotH} rx="22" className="fill-background" />
          <g clipPath="url(#plot-clip)">
          {zones.map((zone) => (
            <rect key={zone.slug} x={zone.x} y={zone.y} width={zone.w} height={zone.h} fill={mark[zone.slug].wash} />
          ))}
          {[0, 25, 50, 75, 100].map((tick) => (
            <g key={`grid-${tick}`}>
              <line x1={xOf(tick)} y1={top} x2={xOf(tick)} y2={plotBottom} stroke="oklch(0.18 0 0 / 0.08)" />
              <line x1={left} y1={yOf(tick)} x2={plotRight} y2={yOf(tick)} stroke="oklch(0.18 0 0 / 0.08)" />
            </g>
          ))}
          <line x1={cutX} y1={top} x2={cutX} y2={plotBottom} stroke="oklch(0.18 0 0)" strokeWidth="1.25" />
          <line x1={left} y1={cutY} x2={plotRight} y2={cutY} stroke="oklch(0.18 0 0)" strokeWidth="1.25" />
          <g>
            <rect x={cutX - 16} y={plotBottom - 18} width="32" height="16" rx="8" fill="#e2e8f0" />
            <text x={cutX} y={plotBottom - 7} textAnchor="middle" fill="#0f172a" fontSize="11" fontFamily="inherit" fontWeight="600">
              {VALUE_LINE}
            </text>
            <rect x={left + 8} y={cutY - 9} width="28" height="18" rx="9" fill="#0f172a" />
            <text x={left + 22} y={cutY + 4} textAnchor="middle" fill="#f8fafc" fontSize="11" fontFamily="inherit" fontWeight="600">
              {RISK_LINE}
            </text>
          </g>
          {pills.map((pill) => {
            const segment = matrixSegments.find((item) => item.slug === pill.slug)!;
            const count = points.filter((point) => point.slug === pill.slug).length;
            const label = `${segment.name} · ${count}`;
            const boxW = label.length * 7.2 + 18;
            const boxX = pill.anchor === "end" ? pill.x - boxW : pill.x;
            return (
              <g key={pill.slug}>
                <rect x={boxX} y={pill.y - 12} width={boxW} height="22" rx="11" fill="oklch(0.99 0.006 95)" stroke="oklch(0.18 0 0 / 0.12)" />
                <circle cx={boxX + 12} cy={pill.y - 1} r="4" fill={mark[pill.slug].core} />
                <text x={boxX + 22} y={pill.y + 3} fill="oklch(0.18 0 0)" fontSize="12" fontFamily="inherit" fontWeight="600">
                  {label}
                </text>
              </g>
            );
          })}
          {ordered.map((point) => {
            const shift = jitter(point.id);
            const cx = xOf(point.value) + shift.dx;
            const cy = yOf(point.risk) + shift.dy;
            const chosen = point.id === activeId;
            const color = mark[point.slug];
            return (
              <a key={point.id} href={`/customers/${point.id}`} aria-label={`${point.name}, value ${point.value}, risk ${point.risk}`}>
                <g
                  filter="url(#point-shadow)"
                  onMouseEnter={() => setActiveId(point.id)}
                  onMouseLeave={() => setActiveId((current) => (current === point.id ? null : current))}
                  onFocus={() => setActiveId(point.id)}
                  onBlur={() => setActiveId((current) => (current === point.id ? null : current))}
                >
                  <circle cx={cx} cy={cy} r={chosen ? 16 : 11} fill={color.halo} opacity={chosen ? 0.55 : 0.35} />
                  <circle cx={cx} cy={cy} r={chosen ? 7.5 : 5.5} fill="oklch(0.99 0.006 95)" />
                  <circle cx={cx} cy={cy} r={chosen ? 5 : 3.6} fill={color.core} />
                </g>
              </a>
            );
          })}
          </g>
          {[0, 25, 50, 75, 100].map((tick) => (
            <g key={`tick-${tick}`}>
              <text x={xOf(tick)} y={plotBottom + 18} textAnchor="middle" fill="oklch(0.18 0 0)" fontSize="12" fontFamily="inherit">
                {tick}
              </text>
              <text x={left - 10} y={yOf(tick)} textAnchor="end" dominantBaseline="middle" fill="oklch(0.18 0 0)" fontSize="12" fontFamily="inherit">
                {tick}
              </text>
            </g>
          ))}
          <text x={left + plotW / 2} y={height - 8} textAnchor="middle" fill="oklch(0.18 0 0)" fontSize="13" fontFamily="inherit" fontWeight="600">
            Value
          </text>
          <text x="18" y={top + plotH / 2} textAnchor="middle" transform={`rotate(-90 18 ${top + plotH / 2})`} fill="oklch(0.18 0 0)" fontSize="13" fontFamily="inherit" fontWeight="600">
            Risk
          </text>
          <rect x={left} y={top} width={plotW} height={plotH} rx="22" fill="none" className="stroke-foreground/15" />
        </svg>
        {active ? (
          <div
            className="pointer-events-none absolute z-10 w-48 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-2xl bg-slate-900 px-3 py-2.5 text-white shadow-lg"
            style={{ left: `${((xOf(active.value) + jitter(active.id).dx) / width) * 100}%`, top: `${((yOf(active.risk) + jitter(active.id).dy) / height) * 100}%` }}
          >
            <p className="text-sm font-semibold">{active.name}</p>
            <p className="mt-1 text-xs text-white/80">Value {active.value} · Risk {active.risk}</p>
            <p className="mt-0.5 text-xs text-white/80">{matrixSegments.find((segment) => segment.slug === active.slug)?.name}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
