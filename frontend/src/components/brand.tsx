import { cn } from "cn";

export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 36" aria-hidden="true" className={cn("size-7", className)}>
      <path
        fill="currentColor"
        d="M16 1.5 28.5 8.7v14.6L16 30.5 3.5 23.3V8.7L16 1.5Zm0 6.2L8.2 12v8l7.8 4.3 7.8-4.3v-8L16 7.7Z"
      />
    </svg>
  );
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", light && "text-background")}>
      <Mark className={light ? "text-primary" : "text-foreground"} />
      <span>
        Customer<span className={light ? "text-primary" : undefined}>IQ</span>
      </span>
    </span>
  );
}
