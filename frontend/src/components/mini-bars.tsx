const series = ["#4f46e5", "#0f766e", "#e11d48", "#d97706", "#7c3aed", "#0284c7", "#db2777", "#65a30d"];

export function MiniBars({
  title,
  rows,
  format,
  wide = false,
}: {
  title?: string;
  rows: Array<{ label: string; value: number }>;
  format?: (value: number) => string;
  wide?: boolean;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <figure className={wide ? "w-full" : "w-full max-w-xs"}>
      {title ? <figcaption className="text-sm font-semibold">{title}</figcaption> : null}
      <ul className={title ? "mt-3 space-y-2" : "space-y-2"}>
        {rows.map((row, index) => {
          const share = row.value <= 0 ? 0 : Math.max(8, Math.round((row.value / max) * 100));
          return (
            <li key={row.label}>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="min-w-0 truncate text-foreground/75">{row.label}</span>
                <span className="shrink-0 font-medium tabular-nums">{format ? format(row.value) : row.value}</span>
              </div>
              <span className="mt-1 block h-1 overflow-hidden rounded-full bg-slate-200">
                <span className="block h-full rounded-full" style={{ width: `${share}%`, background: series[index % series.length] }} />
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
