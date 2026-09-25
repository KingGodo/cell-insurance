export function MiniBars({
  title,
  rows,
  format,
  wide = false,
  compact = false,
}: {
  title?: string;
  rows: Array<{ label: string; value: number; color?: string }>;
  format?: (value: number) => string;
  wide?: boolean;
  compact?: boolean;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <figure className={wide ? "w-full" : "w-full max-w-xs"}>
      {title ? <figcaption className="text-sm font-semibold">{title}</figcaption> : null}
      <ul className={title ? "mt-3 space-y-2.5" : compact ? "space-y-1.5" : "space-y-2.5"}>
        {rows.map((row) => {
          const share = row.value <= 0 ? 0 : Math.max(8, Math.round((row.value / max) * 100));
          return (
            <li key={row.label}>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: row.color ?? "#121212" }} aria-hidden="true" />
                  <span className="truncate text-foreground/80">{row.label}</span>
                </span>
                <span className="shrink-0 font-medium tabular-nums">{format ? format(row.value) : row.value}</span>
              </div>
              <span className={`mt-1 block overflow-hidden rounded-full bg-[#e7e2d6] ${compact ? "h-1" : "h-1.5"}`}>
                <span className="block h-full rounded-full" style={{ width: `${share}%`, background: row.color ?? "#121212" }} />
              </span>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}
