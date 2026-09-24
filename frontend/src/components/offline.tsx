import { ApiError } from "@/lib/api";

export function Offline({ error }: { error: unknown }) {
  const message = error instanceof ApiError ? error.message : "Something went wrong while loading this view.";
  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">CustomerIQ</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">This view needs the API.</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">{message}</p>
      <p className="mt-4 text-sm text-muted-foreground">From the backend folder, run npm run dev, then refresh this page.</p>
    </section>
  );
}
